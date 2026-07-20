import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { CampaignPermissionEntry, DNDCampaign, DNDCharacter } from '../types/dnd_types'
import { GameMap } from '../types/game_types'
import { SessionStartResponse } from '../types/app_types'

// campaign_api/character_api/map_api/permission_api/session_api are mocked at the module
// level (rather than letting calls fall through to the mock backend) so every test
// controls success/failure directly, following the pattern in character_viewmodel.test.ts.
const { mock_campaign_api, mock_character_api, mock_map_api, mock_permission_api, mock_session_api, mock_navigate } =
  vi.hoisted(() => ({
    mock_campaign_api: {
      list: vi.fn<() => Promise<DNDCampaign[]>>(),
      create: vi.fn<(name: string, description?: string) => Promise<DNDCampaign>>(),
      get: vi.fn<(id: string) => Promise<DNDCampaign>>(),
      list_maps: vi.fn<(campaign_id: string) => Promise<GameMap[]>>(),
      list_assets: vi.fn(),
    },
    mock_character_api: {
      list_characters_in_campaign: vi.fn<(campaign_id: string) => Promise<DNDCharacter[]>>(),
    },
    mock_map_api: {
      create: vi.fn<(campaign_id: string, name: string, grid_width: number, grid_height: number) => Promise<GameMap>>(),
    },
    mock_permission_api: {
      get: vi.fn<(campaign_id: string) => Promise<CampaignPermissionEntry[]>>(),
      set: vi.fn<(campaign_id: string, user_id: string, permissions: Omit<CampaignPermissionEntry, 'user_id'>) => Promise<CampaignPermissionEntry>>(),
    },
    mock_session_api: {
      start: vi.fn<(campaign_id: string) => Promise<SessionStartResponse>>(),
      end: vi.fn<(campaign_id: string) => Promise<void>>(),
    },
    mock_navigate: vi.fn(),
  }))

vi.mock('../util/rest_client', () => ({
  campaign_api: mock_campaign_api,
  character_api: mock_character_api,
  map_api: mock_map_api,
  permission_api: mock_permission_api,
  session_api: mock_session_api,
}))

vi.mock('react-router-dom', async (import_original) => {
  const actual = await import_original<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mock_navigate }
})

import { dm_dashboard_viewmodel } from './dm_dashboard_viewmodel'

function make_campaign(overrides: Partial<DNDCampaign> = {}): DNDCampaign {
  return {
    id: 'campaign-1',
    name: 'The Sunken Spire',
    description: 'A cursed lighthouse.',
    dm_id: 'dm-1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function make_map(overrides: Partial<GameMap> = {}): GameMap {
  return {
    id: 'map-1',
    campaign_id: 'campaign-1',
    name: 'Dungeon Level 1',
    grid_width: 30,
    grid_height: 30,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function make_character(overrides: Partial<DNDCharacter> = {}): DNDCharacter {
  return {
    id: 'character-1',
    campaign_id: 'campaign-1',
    name: 'Thorian Ashvale',
    class: 'Fighter',
    race: 'Human',
    level: 5,
    max_hp: 44,
    current_hp: 44,
    armor_class: 17,
    speed: 30,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    skill_profs: [],
    conditions: [],
    equipment: [],
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const INITIAL_STATE = {
  campaigns: [],
  selected_campaign: null,
  session: null,
  active_map_id: null,
  joined_players: [],
}

function render_dashboard() {
  return renderHook(() => dm_dashboard_viewmodel())
}

function render_campaign_sidebar() {
  return renderHook(() => dm_dashboard_viewmodel().campaign_sidebar_model())
}

// create_campaign (called by campaign_sidebar_model's on_create_press) surfaces failures
// via the outer hook's own dashboard_error state, so this renders both together.
function render_campaign_sidebar_with_dashboard() {
  return renderHook(() => {
    const dashboard = dm_dashboard_viewmodel()
    return { ...dashboard, ...dashboard.campaign_sidebar_model() }
  })
}

// Accepts an initial campaign_id and, via renderHook's initialProps/rerender
// mechanism, lets tests simulate a genuine campaign switch by re-rendering with a
// different campaign_id (existing call sites that never call rerender are unaffected).
function render_campaign_detail_panel(campaign_id: string) {
  return renderHook(
    ({ campaign_id }: { campaign_id: string }) => dm_dashboard_viewmodel().campaign_detail_panel_model(campaign_id),
    { initialProps: { campaign_id } }
  )
}

function render_session_controls(join_code: string) {
  return renderHook(() => dm_dashboard_viewmodel().session_controls_model(join_code))
}

function render_map_selector(campaign_id: string) {
  return renderHook(() => dm_dashboard_viewmodel().map_selector_model(campaign_id))
}

function render_permission_panel(campaign_id: string) {
  return renderHook(() => dm_dashboard_viewmodel().permission_panel_model(campaign_id))
}

beforeEach(() => {
  dm_dashboard_model.setState(INITIAL_STATE)
  vi.resetAllMocks()
})

describe('select_campaign', () => {
  it('sets the selected campaign on success', async () => {
    const campaign = make_campaign({ id: 'campaign-1' })
    mock_campaign_api.get.mockResolvedValue(campaign)
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.select_campaign('campaign-1')
    })

    expect(mock_campaign_api.get).toHaveBeenCalledWith('campaign-1')
    expect(dm_dashboard_model.getState().selected_campaign).toEqual(campaign)
  })

  it('leaves the selected campaign untouched and sets dashboard_error when the API call fails', async () => {
    mock_campaign_api.get.mockRejectedValue(new Error('not found'))
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.select_campaign('missing-campaign')
    })

    expect(dm_dashboard_model.getState().selected_campaign).toBeNull()
    expect(result.current.dashboard_error).toBe('not found')
  })
})

describe('start_session', () => {
  it('is a no-op when no campaign is selected', async () => {
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.start_session()
    })

    expect(mock_session_api.start).not.toHaveBeenCalled()
    expect(dm_dashboard_model.getState().session).toBeNull()
  })

  it('starts a session for the selected campaign on success', async () => {
    dm_dashboard_model.getState().set_selected_campaign(make_campaign({ id: 'campaign-1' }))
    mock_session_api.start.mockResolvedValue({ join_code: 'ABC123' })
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.start_session()
    })

    expect(mock_session_api.start).toHaveBeenCalledWith('campaign-1')
    expect(dm_dashboard_model.getState().session).toEqual({ join_code: 'ABC123' })
  })

  it('leaves the session untouched and sets dashboard_error when the API call fails', async () => {
    dm_dashboard_model.getState().set_selected_campaign(make_campaign({ id: 'campaign-1' }))
    mock_session_api.start.mockRejectedValue(new Error('start failed'))
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.start_session()
    })

    expect(dm_dashboard_model.getState().session).toBeNull()
    expect(result.current.dashboard_error).toBe('start failed')
  })
})

describe('end_session', () => {
  it('is a no-op when no campaign is selected', async () => {
    dm_dashboard_model.getState().set_session({ join_code: 'ABC123' })
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.end_session()
    })

    expect(mock_session_api.end).not.toHaveBeenCalled()
    expect(dm_dashboard_model.getState().session).toEqual({ join_code: 'ABC123' })
  })

  it('ends the session and clears joined players for the selected campaign on success', async () => {
    dm_dashboard_model.getState().set_selected_campaign(make_campaign({ id: 'campaign-1' }))
    dm_dashboard_model.getState().set_session({ join_code: 'ABC123' })
    dm_dashboard_model.getState().add_joined_player({ user_id: 'user-1', character_name: 'Thorian Ashvale' })
    mock_session_api.end.mockResolvedValue(undefined)
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.end_session()
    })

    expect(mock_session_api.end).toHaveBeenCalledWith('campaign-1')
    expect(dm_dashboard_model.getState().session).toBeNull()
    expect(dm_dashboard_model.getState().joined_players).toEqual([])
  })

  it('leaves the session and joined players untouched and sets dashboard_error when the API call fails', async () => {
    dm_dashboard_model.getState().set_selected_campaign(make_campaign({ id: 'campaign-1' }))
    dm_dashboard_model.getState().set_session({ join_code: 'ABC123' })
    dm_dashboard_model.getState().add_joined_player({ user_id: 'user-1', character_name: 'Thorian Ashvale' })
    mock_session_api.end.mockRejectedValue(new Error('end failed'))
    const { result } = render_dashboard()

    await act(async () => {
      await result.current.end_session()
    })

    expect(dm_dashboard_model.getState().session).toEqual({ join_code: 'ABC123' })
    expect(dm_dashboard_model.getState().joined_players).toEqual([{ user_id: 'user-1', character_name: 'Thorian Ashvale' }])
    expect(result.current.dashboard_error).toBe('end failed')
  })
})

describe('campaign_sidebar_model', () => {
  it('does nothing when the campaign name is blank', () => {
    const { result } = render_campaign_sidebar()

    act(() => {
      result.current.on_create_press()
    })

    expect(mock_campaign_api.create).not.toHaveBeenCalled()
  })

  it('creates a campaign with the trimmed name and description, and resets both drafts immediately', async () => {
    const new_campaign = make_campaign({ id: 'campaign-1', name: 'The Sunken Spire' })
    mock_campaign_api.create.mockResolvedValue(new_campaign)
    const { result } = render_campaign_sidebar()

    act(() => {
      result.current.on_name_change({ target: { value: '  The Sunken Spire  ' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_description_change({
        target: { value: '  A cursed lighthouse.  ' },
      } as React.ChangeEvent<HTMLTextAreaElement>)
    })

    act(() => {
      result.current.on_create_press()
    })

    expect(mock_campaign_api.create).toHaveBeenCalledWith('The Sunken Spire', 'A cursed lighthouse.')
    expect(result.current.name).toBe('')
    expect(result.current.description).toBe('')
    await waitFor(() => expect(dm_dashboard_model.getState().campaigns).toEqual([new_campaign]))
  })

  it('passes undefined for the description when it is blank', () => {
    mock_campaign_api.create.mockResolvedValue(make_campaign())
    const { result } = render_campaign_sidebar()

    act(() => {
      result.current.on_name_change({ target: { value: 'The Sunken Spire' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_create_press()
    })

    expect(mock_campaign_api.create).toHaveBeenCalledWith('The Sunken Spire', undefined)
  })

  it('sets dashboard_error and does not add the campaign when creation fails', async () => {
    mock_campaign_api.create.mockRejectedValue(new Error('creation failed'))
    const { result } = render_campaign_sidebar_with_dashboard()

    act(() => {
      result.current.on_name_change({ target: { value: 'The Sunken Spire' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_create_press()
    })

    await waitFor(() => expect(result.current.dashboard_error).toBe('creation failed'))
    expect(dm_dashboard_model.getState().campaigns).toEqual([])
  })
})

describe('campaign_detail_panel_model', () => {
  describe('on_create_map_press validation', () => {
    it('does nothing when the map name is blank', async () => {
      const { result } = render_campaign_detail_panel('campaign-1')

      await act(async () => {
        await result.current.on_create_map_press()
      })

      expect(mock_map_api.create).not.toHaveBeenCalled()
      expect(result.current.new_map_validation_error).toBeNull()
    })

    it.each([
      ['zero', '0'],
      ['negative', '-5'],
      ['decimal', '5.5'],
      ['non-numeric', 'abc'],
    ])('rejects a %s grid width', async (_label, invalid_width) => {
      const { result } = render_campaign_detail_panel('campaign-1')
      act(() => {
        result.current.on_new_map_name_change({ target: { value: 'Dungeon Level 1' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_width_change({ target: { value: invalid_width } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_height_change({ target: { value: '30' } } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.on_create_map_press()
      })

      expect(mock_map_api.create).not.toHaveBeenCalled()
      expect(result.current.new_map_validation_error).toBe('Grid width and height must be positive whole numbers')
    })

    it.each([
      ['zero', '0'],
      ['negative', '-5'],
      ['decimal', '5.5'],
      ['non-numeric', 'abc'],
    ])('rejects a %s grid height', async (_label, invalid_height) => {
      const { result } = render_campaign_detail_panel('campaign-1')
      act(() => {
        result.current.on_new_map_name_change({ target: { value: 'Dungeon Level 1' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_width_change({ target: { value: '30' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_height_change({ target: { value: invalid_height } } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.on_create_map_press()
      })

      expect(mock_map_api.create).not.toHaveBeenCalled()
      expect(result.current.new_map_validation_error).toBe('Grid width and height must be positive whole numbers')
    })
  })

  describe('on_create_map_press success/failure', () => {
    it('creates the map, appends it to maps, and navigates to the map builder', async () => {
      const new_map = make_map({ id: 'map-1' })
      mock_map_api.create.mockResolvedValue(new_map)
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_new_map_name_change({ target: { value: 'Dungeon Level 1' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_width_change({ target: { value: '20' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_height_change({ target: { value: '25' } } as React.ChangeEvent<HTMLInputElement>)
      })

      await act(async () => {
        await result.current.on_create_map_press()
      })

      expect(mock_map_api.create).toHaveBeenCalledWith('campaign-1', 'Dungeon Level 1', 20, 25)
      expect(result.current.maps).toEqual([new_map])
      expect(mock_navigate).toHaveBeenCalledWith('/dm/map-builder/map-1')
      expect(result.current.is_creating_map).toBe(false)
    })

    it('leaves is_creating_map false and does not navigate when the API call fails', async () => {
      mock_map_api.create.mockRejectedValue(new Error('creation failed'))
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_new_map_name_change({ target: { value: 'Dungeon Level 1' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_width_change({ target: { value: '20' } } as React.ChangeEvent<HTMLInputElement>)
        result.current.on_new_map_grid_height_change({ target: { value: '25' } } as React.ChangeEvent<HTMLInputElement>)
      })

      await expect(
        act(async () => {
          await result.current.on_create_map_press()
        })
      ).rejects.toThrow('creation failed')

      expect(result.current.maps).toEqual([])
      expect(mock_navigate).not.toHaveBeenCalled()
      expect(result.current.is_creating_map).toBe(false)
    })
  })

  describe('load_characters', () => {
    it('populates characters from the API on success', async () => {
      const characters = [make_character({ id: 'character-1' })]
      mock_character_api.list_characters_in_campaign.mockResolvedValue(characters)
      const { result } = render_campaign_detail_panel('campaign-1')

      await act(async () => {
        await result.current.load_characters()
      })

      expect(mock_character_api.list_characters_in_campaign).toHaveBeenCalledWith('campaign-1')
      expect(result.current.characters).toEqual(characters)
      expect(result.current.characters_error).toBeNull()
    })

    it('leaves characters untouched and sets characters_error when the API call fails', async () => {
      mock_character_api.list_characters_in_campaign.mockRejectedValue(new Error('network error'))
      const { result } = render_campaign_detail_panel('campaign-1')

      await act(async () => {
        await result.current.load_characters()
      })

      expect(result.current.characters).toEqual([])
      expect(result.current.characters_error).toBe('network error')
    })
  })

  describe('character selection', () => {
    it('selects a character via on_character_select', () => {
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_character_select('character-1')
      })

      expect(result.current.selected_character_id).toBe('character-1')
    })

    it('clears the selection via on_back_to_characters_press', () => {
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_character_select('character-1')
      })
      act(() => {
        result.current.on_back_to_characters_press()
      })

      expect(result.current.selected_character_id).toBeNull()
    })

    // Regression test: clearing selection used to happen at the end of load_characters,
    // after its await — so a load_characters call that resolves *after* the user has
    // since selected a character (e.g. a slow/duplicate call, as React StrictMode's
    // dev-mode double effect invocation produces) would wipe out that selection out
    // from under them. Selection-clearing must never be driven by load_characters'
    // resolution — only by a genuine campaign_id change (see the next test).
    it('does not clear an existing selection when load_characters resolves', async () => {
      mock_character_api.list_characters_in_campaign.mockResolvedValue([])
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_character_select('character-1')
      })
      expect(result.current.selected_character_id).toBe('character-1')

      await act(async () => {
        await result.current.load_characters()
      })

      expect(result.current.selected_character_id).toBe('character-1')
    })

    // Selection must be cleared synchronously on a genuine campaign switch, without
    // waiting on any network call — this test never mocks/resolves
    // list_characters_in_campaign at all, proving the clear can't be gated on it.
    it('clears the selection synchronously when campaign_id changes, independent of any API call', () => {
      const { result, rerender } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_character_select('character-1')
      })
      expect(result.current.selected_character_id).toBe('character-1')

      rerender({ campaign_id: 'campaign-2' })

      expect(result.current.selected_character_id).toBeNull()
      expect(mock_character_api.list_characters_in_campaign).not.toHaveBeenCalled()
    })
  })

  describe('load_maps', () => {
    it('populates maps from the API on success', async () => {
      const maps = [make_map({ id: 'map-1' })]
      mock_campaign_api.list_maps.mockResolvedValue(maps)
      const { result } = render_campaign_detail_panel('campaign-1')

      await act(async () => {
        await result.current.load_maps()
      })

      expect(mock_campaign_api.list_maps).toHaveBeenCalledWith('campaign-1')
      expect(result.current.maps).toEqual(maps)
      expect(result.current.maps_error).toBeNull()
    })

    it('leaves maps untouched and sets maps_error when the API call fails', async () => {
      mock_campaign_api.list_maps.mockRejectedValue(new Error('network error'))
      const { result } = render_campaign_detail_panel('campaign-1')

      await act(async () => {
        await result.current.load_maps()
      })

      expect(result.current.maps).toEqual([])
      expect(result.current.maps_error).toBe('network error')
    })
  })

  describe('map selection', () => {
    it('selects a map via on_map_select', () => {
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_map_select('map-1')
      })

      expect(result.current.selected_map_id).toBe('map-1')
    })

    it('clears the selection via on_back_to_maps_press', () => {
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_map_select('map-1')
      })
      act(() => {
        result.current.on_back_to_maps_press()
      })

      expect(result.current.selected_map_id).toBeNull()
    })

    // Regression test: mirrors the character-selection regression test above — the
    // fix (clearing selection off the campaign_id effect, not an async load's
    // resolution) covers selected_map_id via the very same effect, but this asserts
    // it directly for maps too.
    it('does not clear an existing selection when load_maps resolves', async () => {
      mock_campaign_api.list_maps.mockResolvedValue([])
      const { result } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_map_select('map-1')
      })
      expect(result.current.selected_map_id).toBe('map-1')

      await act(async () => {
        await result.current.load_maps()
      })

      expect(result.current.selected_map_id).toBe('map-1')
    })

    // Selection must be cleared synchronously on a genuine campaign switch, without
    // waiting on any network call — this test never mocks/resolves list_maps at all,
    // proving the clear can't be gated on it.
    it('clears the selection synchronously when campaign_id changes, independent of any API call', () => {
      const { result, rerender } = render_campaign_detail_panel('campaign-1')

      act(() => {
        result.current.on_map_select('map-1')
      })
      expect(result.current.selected_map_id).toBe('map-1')

      rerender({ campaign_id: 'campaign-2' })

      expect(result.current.selected_map_id).toBeNull()
      expect(mock_campaign_api.list_maps).not.toHaveBeenCalled()
    })
  })
})

describe('session_controls_model', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('copies the join code to the clipboard and reports copied for 1500ms', async () => {
    const { result } = render_session_controls('ABC123')

    await act(async () => {
      await result.current.on_copy_press()
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123')
    expect(result.current.copied).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(result.current.copied).toBe(false)
  })
})

describe('map_selector_model', () => {
  it('populates maps from the API on success', async () => {
    const maps = [make_map({ id: 'map-1' }), make_map({ id: 'map-2' })]
    mock_campaign_api.list_maps.mockResolvedValue(maps)
    const { result } = render_map_selector('campaign-1')

    await act(async () => {
      await result.current.load_maps()
    })

    expect(mock_campaign_api.list_maps).toHaveBeenCalledWith('campaign-1')
    expect(result.current.maps).toEqual(maps)
    expect(result.current.maps_error).toBeNull()
  })

  it('leaves maps untouched and sets maps_error when the API call fails', async () => {
    mock_campaign_api.list_maps.mockRejectedValue(new Error('network error'))
    const { result } = render_map_selector('campaign-1')

    await act(async () => {
      await result.current.load_maps()
    })

    expect(result.current.maps).toEqual([])
    expect(result.current.maps_error).toBe('network error')
  })
})

describe('permission_panel_model', () => {
  describe('load_permissions', () => {
    it('keys permissions by user_id on success', async () => {
      const entries: CampaignPermissionEntry[] = [
        { user_id: 'user-1', can_move_tokens: true, can_place_tiles: false },
        { user_id: 'user-2', can_move_tokens: false, can_place_tiles: true },
      ]
      mock_permission_api.get.mockResolvedValue(entries)
      const { result } = render_permission_panel('campaign-1')

      await act(async () => {
        await result.current.load_permissions()
      })

      expect(result.current.get_player_permissions('user-1')).toEqual(entries[0])
      expect(result.current.get_player_permissions('user-2')).toEqual(entries[1])
    })

    it('leaves permissions untouched and sets permissions_error when the API call fails', async () => {
      mock_permission_api.get.mockRejectedValue(new Error('network error'))
      const { result } = render_permission_panel('campaign-1')

      await act(async () => {
        await result.current.load_permissions()
      })

      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: false,
        can_place_tiles: false,
      })
      expect(result.current.permissions_error).toBe('network error')
    })
  })

  describe('get_player_permissions', () => {
    it('defaults to both permissions off for a player with no existing record', () => {
      const { result } = render_permission_panel('campaign-1')

      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: false,
        can_place_tiles: false,
      })
    })
  })

  describe('toggle_permission', () => {
    it('toggles one field while preserving the sibling field, for an existing record', async () => {
      mock_permission_api.get.mockResolvedValue([{ user_id: 'user-1', can_move_tokens: true, can_place_tiles: false }])
      mock_permission_api.set.mockResolvedValue({ user_id: 'user-1', can_move_tokens: true, can_place_tiles: true })
      const { result } = render_permission_panel('campaign-1')
      await act(async () => {
        await result.current.load_permissions()
      })

      await act(async () => {
        await result.current.toggle_permission('user-1', 'can_place_tiles')
      })

      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: true,
        can_place_tiles: true,
      })
      expect(mock_permission_api.set).toHaveBeenCalledWith('campaign-1', 'user-1', {
        can_move_tokens: true,
        can_place_tiles: true,
      })
    })

    it('defaults to both-off before toggling when the player has no existing record', async () => {
      mock_permission_api.set.mockResolvedValue({ user_id: 'user-1', can_move_tokens: true, can_place_tiles: false })
      const { result } = render_permission_panel('campaign-1')

      await act(async () => {
        await result.current.toggle_permission('user-1', 'can_move_tokens')
      })

      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: true,
        can_place_tiles: false,
      })
    })

    it('keeps the optimistic toggle applied but sets permissions_error when the API call fails', async () => {
      mock_permission_api.get.mockResolvedValue([{ user_id: 'user-1', can_move_tokens: false, can_place_tiles: false }])
      mock_permission_api.set.mockRejectedValue(new Error('save failed'))
      const { result } = render_permission_panel('campaign-1')
      await act(async () => {
        await result.current.load_permissions()
      })

      let toggle_promise!: Promise<void>
      act(() => {
        toggle_promise = result.current.toggle_permission('user-1', 'can_move_tokens')
      })

      // The optimistic update is applied synchronously, before the API call
      // has even had a chance to resolve or reject.
      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: true,
        can_place_tiles: false,
      })

      await act(async () => {
        await toggle_promise
      })

      // No rollback on failure — the optimistic update remains applied, but the
      // failure is surfaced via permissions_error rather than an unhandled rejection.
      expect(result.current.get_player_permissions('user-1')).toEqual({
        user_id: 'user-1',
        can_move_tokens: true,
        can_place_tiles: false,
      })
      expect(result.current.permissions_error).toBe('save failed')
    })
  })
})
