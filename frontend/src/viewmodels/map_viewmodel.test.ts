import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { map_model } from '../models/map_model'
import { GameMap, MapTile, Token } from '../types/game_types'
import { CampaignPermissionEntry } from '../types/dnd_types'

// map_api/permission_api are mocked at the module level (rather than letting calls fall
// through to the mock backend) so every test controls success/failure directly, following
// the pattern in character_viewmodel.test.ts. websocket_hook is mocked so tests can assert
// on outgoing `send` calls without a real WebSocket connection.
const { mock_map_api, mock_permission_api, mock_send } = vi.hoisted(() => ({
  mock_map_api: {
    getTiles: vi.fn<(map_id: string) => Promise<MapTile[]>>(),
    putTiles: vi.fn<(map_id: string, tiles: MapTile[]) => Promise<void>>(),
    getTokens: vi.fn<(map_id: string) => Promise<Token[]>>(),
    get: vi.fn<(map_id: string) => Promise<GameMap>>(),
  },
  mock_permission_api: {
    get: vi.fn<(campaign_id: string) => Promise<CampaignPermissionEntry[]>>(),
  },
  mock_send: vi.fn(),
}))

vi.mock('../util/rest_client', () => ({
  map_api: mock_map_api,
  permission_api: mock_permission_api,
}))

vi.mock('../util/websockets', () => ({
  websocket_hook: () => ({ send: mock_send }),
}))

import { map_viewmodel } from './map_viewmodel'

function make_tile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    map_id: 'map-1',
    asset_id: 'default_floor_stone',
    asset_source: 'default',
    grid_x: 0,
    grid_y: 0,
    grid_z: 0,
    rotation_y: 0,
    ...overrides,
  }
}

function make_token(overrides: Partial<Token> = {}): Token {
  return {
    id: 'token-1',
    character_id: 'character-1',
    grid_x: 0,
    grid_y: 0,
    ...overrides,
  }
}

function make_map(overrides: Partial<GameMap> = {}): GameMap {
  return {
    id: 'map-1',
    campaign_id: 'campaign-1',
    name: 'The Sunken Spire — Ground Floor',
    grid_width: 20,
    grid_height: 20,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function render_map_viewmodel() {
  return renderHook(() => map_viewmodel())
}

function render_map_info(map_id: string | null) {
  return renderHook(() => map_viewmodel().map_info_model(map_id))
}

beforeEach(() => {
  map_model.getState().reset()
  vi.resetAllMocks()
})

describe('load_map', () => {
  it('loads tiles and tokens and sets them as the active map on success', async () => {
    const tiles = [make_tile({ id: 'tile-1' })]
    const tokens = [make_token({ id: 'token-1' })]
    mock_map_api.getTiles.mockResolvedValue(tiles)
    mock_map_api.getTokens.mockResolvedValue(tokens)
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.load_map('map-1')
    })

    expect(mock_map_api.getTiles).toHaveBeenCalledWith('map-1')
    expect(mock_map_api.getTokens).toHaveBeenCalledWith('map-1')
    expect(map_model.getState().active_map_id).toBe('map-1')
    expect(map_model.getState().tiles).toEqual(tiles)
    expect(map_model.getState().tokens).toEqual(tokens)
    expect(result.current.tiles_loading).toBe(false)
    expect(result.current.tiles_error).toBeNull()
  })

  it('sets tiles_loading while the request is in flight and clears it once resolved', async () => {
    let resolve_tiles!: (tiles: MapTile[]) => void
    mock_map_api.getTiles.mockImplementation(() => new Promise<MapTile[]>((resolve) => { resolve_tiles = resolve }))
    mock_map_api.getTokens.mockResolvedValue([])
    const { result } = render_map_viewmodel()

    let load_promise!: Promise<void>
    act(() => {
      load_promise = result.current.load_map('map-1')
    })

    expect(result.current.tiles_loading).toBe(true)

    await act(async () => {
      resolve_tiles([])
      await load_promise
    })

    expect(result.current.tiles_loading).toBe(false)
  })

  it('sets tiles_error and stops loading when the API call fails', async () => {
    mock_map_api.getTiles.mockRejectedValue(new Error('network error'))
    mock_map_api.getTokens.mockResolvedValue([])
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.load_map('map-1')
    })

    expect(result.current.tiles_error).toBe('network error')
    expect(result.current.tiles_loading).toBe(false)
    expect(map_model.getState().active_map_id).toBeNull()
  })

  it('drops a stale response for a map that is no longer active once a newer load_map call for a different map has already completed', async () => {
    let resolve_tiles_for_map_a!: (tiles: MapTile[]) => void
    mock_map_api.getTiles.mockImplementation((map_id: string) => {
      if (map_id === 'map-a') {
        return new Promise<MapTile[]>((resolve) => { resolve_tiles_for_map_a = resolve })
      }
      return Promise.resolve([make_tile({ id: 'tile-b', map_id: 'map-b' })])
    })
    mock_map_api.getTokens.mockResolvedValue([])
    const { result } = render_map_viewmodel()

    let load_map_a_promise!: Promise<void>
    act(() => {
      load_map_a_promise = result.current.load_map('map-a')
    })

    // A second, faster load_map call for a different map — e.g. the DM switched maps
    // while the first request for map-a was still in flight — resolves first.
    await act(async () => {
      await result.current.load_map('map-b')
    })

    expect(map_model.getState().active_map_id).toBe('map-b')
    expect(map_model.getState().tiles).toEqual([make_tile({ id: 'tile-b', map_id: 'map-b' })])

    // The stale map-a response now finally arrives; it must be dropped rather than
    // clobbering map-b's already-applied tiles.
    await act(async () => {
      resolve_tiles_for_map_a([make_tile({ id: 'tile-a-stale', map_id: 'map-a' })])
      await load_map_a_promise
    })

    expect(map_model.getState().active_map_id).toBe('map-b')
    expect(map_model.getState().tiles).toEqual([make_tile({ id: 'tile-b', map_id: 'map-b' })])
  })
})

describe('activate_map', () => {
  it('fetches tiles and broadcasts map_activated for a non-null map id', async () => {
    const tiles = [make_tile({ id: 'tile-1' })]
    mock_map_api.getTiles.mockResolvedValue(tiles)
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.activate_map('map-1')
    })

    expect(mock_map_api.getTiles).toHaveBeenCalledWith('map-1')
    expect(mock_send).toHaveBeenCalledWith('map_activated', { map_id: 'map-1', tiles })
  })

  it('broadcasts an empty snapshot without fetching tiles when hiding the map (null id)', async () => {
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.activate_map(null)
    })

    expect(mock_map_api.getTiles).not.toHaveBeenCalled()
    expect(mock_send).toHaveBeenCalledWith('map_activated', { map_id: null, tiles: [] })
  })

  it('does not broadcast when fetching tiles fails', async () => {
    mock_map_api.getTiles.mockRejectedValue(new Error('network error'))
    const { result } = render_map_viewmodel()

    await expect(
      act(async () => {
        await result.current.activate_map('map-1')
      })
    ).rejects.toThrow('network error')

    expect(mock_send).not.toHaveBeenCalled()
  })
})

describe('place_map_tile', () => {
  const new_tile_data = {
    asset_id: 'default_floor_stone',
    asset_source: 'default' as const,
    grid_x: 2,
    grid_y: 3,
    grid_z: 0,
    rotation_y: 0,
  }

  it('optimistically adds the tile and persists the full tile list on success', async () => {
    mock_map_api.putTiles.mockResolvedValue(undefined)
    const { result } = render_map_viewmodel()

    let did_placement_succeed!: boolean
    await act(async () => {
      did_placement_succeed = await result.current.place_map_tile('map-1', new_tile_data)
    })

    expect(map_model.getState().tiles).toHaveLength(1)
    expect(map_model.getState().tiles[0]).toMatchObject({ ...new_tile_data, map_id: 'map-1' })
    expect(mock_map_api.putTiles).toHaveBeenCalledWith('map-1', map_model.getState().tiles)
    expect(result.current.tiles_error).toBeNull()
    // A caller (e.g. the map builder view) relies on this resolved value to know
    // whether to surface a placement confirmation.
    expect(did_placement_succeed).toBe(true)
  })

  it('broadcasts map_tile_placed once persistence succeeds, so the notification center (see websockets.ts) picks it up', async () => {
    mock_map_api.putTiles.mockResolvedValue(undefined)
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.place_map_tile('map-1', new_tile_data)
    })

    const placed_tile_id = map_model.getState().tiles[0].id
    expect(mock_send).toHaveBeenCalledWith('map_tile_placed', {
      tile_id: placed_tile_id,
      asset_id: new_tile_data.asset_id,
      asset_source: new_tile_data.asset_source,
      grid_x: new_tile_data.grid_x,
      grid_y: new_tile_data.grid_y,
      grid_z: new_tile_data.grid_z,
      rotation_y: new_tile_data.rotation_y,
    })
  })

  it('keeps the optimistic tile but sets tiles_error when persisting fails', async () => {
    mock_map_api.putTiles.mockRejectedValue(new Error('save failed'))
    const { result } = render_map_viewmodel()

    let did_placement_succeed!: boolean
    await act(async () => {
      did_placement_succeed = await result.current.place_map_tile('map-1', new_tile_data)
    })

    expect(map_model.getState().tiles).toHaveLength(1)
    expect(result.current.tiles_error).toBe('save failed')
    // A failed persist must not resolve truthy, so callers don't show a confirmation.
    expect(did_placement_succeed).toBe(false)
    expect(mock_send).not.toHaveBeenCalled()
  })
})

describe('remove_map_tile', () => {
  it('optimistically removes the tile and persists the remaining tile list on success', async () => {
    const remaining_tile = make_tile({ id: 'tile-2', grid_x: 1 })
    map_model.getState().place_tile(make_tile({ id: 'tile-1' }))
    map_model.getState().place_tile(remaining_tile)
    mock_map_api.putTiles.mockResolvedValue(undefined)
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.remove_map_tile('map-1', 'tile-1')
    })

    expect(map_model.getState().tiles).toEqual([remaining_tile])
    expect(mock_map_api.putTiles).toHaveBeenCalledWith('map-1', [remaining_tile])
    expect(result.current.tiles_error).toBeNull()
  })

  it('keeps the tile removed but sets tiles_error when persisting fails', async () => {
    map_model.getState().place_tile(make_tile({ id: 'tile-1' }))
    mock_map_api.putTiles.mockRejectedValue(new Error('save failed'))
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.remove_map_tile('map-1', 'tile-1')
    })

    expect(map_model.getState().tiles).toEqual([])
    expect(result.current.tiles_error).toBe('save failed')
  })
})

describe('move_token', () => {
  it('optimistically updates the token position in the store and broadcasts token_moved', () => {
    map_model.getState().set_tokens([make_token({ id: 'token-1', grid_x: 0, grid_y: 0 })])
    const { result } = render_map_viewmodel()

    act(() => {
      result.current.move_token('token-1', 'character-1', 5, 6)
    })

    expect(map_model.getState().tokens).toEqual([make_token({ id: 'token-1', grid_x: 5, grid_y: 6 })])
    expect(mock_send).toHaveBeenCalledWith('token_moved', {
      token_id: 'token-1',
      character_id: 'character-1',
      grid_x: 5,
      grid_y: 6,
    })
  })

  // NOTE (flagged for task_master, see final report): the ticket's acceptance criteria
  // describe an "occupied-cell rejection" for move_token, but no such guard exists in
  // map_viewmodel.ts today — the only occupied-cell check in the codebase lives in the
  // view layer (views/todo_views/map_view/token_layer.tsx, a stub not wired into
  // routing per CLAUDE.md). This test documents move_token's actual current behavior
  // rather than inventing a guard that isn't there.
  it('does not reject a move onto a cell already occupied by another token (no such guard exists at this layer)', () => {
    map_model.getState().set_tokens([
      make_token({ id: 'token-1', grid_x: 0, grid_y: 0 }),
      make_token({ id: 'token-2', grid_x: 5, grid_y: 6 }),
    ])
    const { result } = render_map_viewmodel()

    act(() => {
      result.current.move_token('token-1', 'character-1', 5, 6)
    })

    expect(map_model.getState().tokens).toEqual([
      make_token({ id: 'token-1', grid_x: 5, grid_y: 6 }),
      make_token({ id: 'token-2', grid_x: 5, grid_y: 6 }),
    ])
    expect(mock_send).toHaveBeenCalledWith('token_moved', {
      token_id: 'token-1',
      character_id: 'character-1',
      grid_x: 5,
      grid_y: 6,
    })
  })
})

describe('load_permissions', () => {
  it('populates permissions from the API on success', async () => {
    const permissions: CampaignPermissionEntry[] = [{ user_id: 'user-1', can_move_tokens: true, can_place_tiles: false }]
    mock_permission_api.get.mockResolvedValue(permissions)
    const { result } = render_map_viewmodel()

    await act(async () => {
      await result.current.load_permissions('campaign-1')
    })

    expect(mock_permission_api.get).toHaveBeenCalledWith('campaign-1')
    expect(result.current.permissions).toEqual(permissions)
  })

  it('leaves permissions untouched when the API call fails', async () => {
    mock_permission_api.get.mockRejectedValue(new Error('network error'))
    const { result } = render_map_viewmodel()

    await expect(
      act(async () => {
        await result.current.load_permissions('campaign-1')
      })
    ).rejects.toThrow('network error')

    expect(result.current.permissions).toEqual([])
  })
})

describe('map_info_model', () => {
  it('loads the map by id and exposes it once load_map_info resolves', async () => {
    const map = make_map({ id: 'map-1', name: 'The Sunken Spire — Ground Floor' })
    mock_map_api.get.mockResolvedValue(map)
    const { result } = render_map_info('map-1')

    expect(result.current.map).toBeNull()

    await act(async () => {
      await result.current.load_map_info()
    })

    expect(mock_map_api.get).toHaveBeenCalledWith('map-1')
    expect(result.current.map).toEqual(map)
  })

  it('leaves map null and skips the API call when map_id is null', async () => {
    const { result } = render_map_info(null)

    await act(async () => {
      await result.current.load_map_info()
    })

    expect(mock_map_api.get).not.toHaveBeenCalled()
    expect(result.current.map).toBeNull()
  })
})
