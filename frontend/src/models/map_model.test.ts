import { describe, expect, it, beforeEach } from 'vitest'
import { map_model } from './map_model'
import { MapTile, Token } from '../types/game_types'

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

describe('map_model', () => {
  beforeEach(() => {
    map_model.getState().reset()
  })

  describe('set_active_map', () => {
    it('sets the active map id and its tiles', () => {
      const tiles = [make_tile({ id: 'tile-1' }), make_tile({ id: 'tile-2', grid_x: 1 })]

      map_model.getState().set_active_map('map-1', tiles)

      expect(map_model.getState().active_map_id).toBe('map-1')
      expect(map_model.getState().tiles).toEqual(tiles)
    })

    it('accepts null to clear the active map', () => {
      map_model.getState().set_active_map('map-1', [make_tile()])

      map_model.getState().set_active_map(null, [])

      expect(map_model.getState().active_map_id).toBeNull()
      expect(map_model.getState().tiles).toEqual([])
    })
  })

  describe('set_mode', () => {
    it('sets the mode to build', () => {
      map_model.getState().set_mode('build')

      expect(map_model.getState().mode).toBe('build')
    })

    it('sets the mode to view', () => {
      map_model.getState().set_mode('build')

      map_model.getState().set_mode('view')

      expect(map_model.getState().mode).toBe('view')
    })
  })

  describe('set_selected_asset', () => {
    it('sets the selected asset', () => {
      map_model.getState().set_selected_asset({ id: 'asset-1', source: 'default' })

      expect(map_model.getState().selected_asset).toEqual({ id: 'asset-1', source: 'default' })
    })

    it('clears the selected asset with null', () => {
      map_model.getState().set_selected_asset({ id: 'asset-1', source: 'default' })

      map_model.getState().set_selected_asset(null)

      expect(map_model.getState().selected_asset).toBeNull()
    })
  })

  describe('place_tile', () => {
    it('adds a tile at a previously unoccupied grid position', () => {
      const tile = make_tile({ id: 'tile-1', grid_x: 0, grid_y: 0, grid_z: 0 })

      map_model.getState().place_tile(tile)

      expect(map_model.getState().tiles).toEqual([tile])
    })

    it('replaces any existing tile at the same grid_x/grid_y/grid_z', () => {
      const original_tile = make_tile({ id: 'tile-1', grid_x: 0, grid_y: 0, grid_z: 0, asset_id: 'default_floor_stone' })
      map_model.getState().place_tile(original_tile)

      const replacement_tile = make_tile({ id: 'tile-2', grid_x: 0, grid_y: 0, grid_z: 0, asset_id: 'default_wall_brick' })
      map_model.getState().place_tile(replacement_tile)

      expect(map_model.getState().tiles).toEqual([replacement_tile])
    })

    it('keeps existing tiles at other grid positions', () => {
      const tile_at_origin = make_tile({ id: 'tile-1', grid_x: 0, grid_y: 0, grid_z: 0 })
      map_model.getState().place_tile(tile_at_origin)

      const tile_elsewhere = make_tile({ id: 'tile-2', grid_x: 5, grid_y: 5, grid_z: 0 })
      map_model.getState().place_tile(tile_elsewhere)

      expect(map_model.getState().tiles).toEqual([tile_at_origin, tile_elsewhere])
    })
  })

  describe('remove_tile', () => {
    it('removes the tile with the given id', () => {
      const tile = make_tile({ id: 'tile-1' })
      map_model.getState().place_tile(tile)

      map_model.getState().remove_tile('tile-1')

      expect(map_model.getState().tiles).toEqual([])
    })

    it('is a no-op when the tile id does not exist', () => {
      const tile = make_tile({ id: 'tile-1' })
      map_model.getState().place_tile(tile)

      map_model.getState().remove_tile('nonexistent-id')

      expect(map_model.getState().tiles).toEqual([tile])
    })
  })

  describe('move_token', () => {
    it('updates the grid position of the matching token', () => {
      map_model.getState().set_tokens([make_token({ id: 'token-1', grid_x: 0, grid_y: 0 })])

      map_model.getState().move_token('token-1', 3, 4)

      expect(map_model.getState().tokens).toEqual([make_token({ id: 'token-1', grid_x: 3, grid_y: 4 })])
    })

    it('leaves other tokens untouched', () => {
      const other_token = make_token({ id: 'token-2', grid_x: 1, grid_y: 1 })
      map_model.getState().set_tokens([make_token({ id: 'token-1', grid_x: 0, grid_y: 0 }), other_token])

      map_model.getState().move_token('token-1', 3, 4)

      expect(map_model.getState().tokens[1]).toEqual(other_token)
    })

    it('is a no-op when the token id does not exist', () => {
      const token = make_token({ id: 'token-1', grid_x: 0, grid_y: 0 })
      map_model.getState().set_tokens([token])

      map_model.getState().move_token('nonexistent-id', 3, 4)

      expect(map_model.getState().tokens).toEqual([token])
    })
  })

  describe('set_tokens', () => {
    it('replaces the entire token list', () => {
      map_model.getState().set_tokens([make_token({ id: 'stale-token' })])

      const tokens = [make_token({ id: 'token-1' }), make_token({ id: 'token-2' })]
      map_model.getState().set_tokens(tokens)

      expect(map_model.getState().tokens).toEqual(tokens)
    })
  })

  describe('sync_tiles', () => {
    it('replaces the entire tile list', () => {
      map_model.getState().place_tile(make_tile({ id: 'stale-tile' }))

      const tiles = [make_tile({ id: 'tile-1' }), make_tile({ id: 'tile-2', grid_x: 1 })]
      map_model.getState().sync_tiles(tiles)

      expect(map_model.getState().tiles).toEqual(tiles)
    })
  })

  describe('set_tiles_loading', () => {
    it('sets the tiles_loading flag to true', () => {
      map_model.getState().set_tiles_loading(true)

      expect(map_model.getState().tiles_loading).toBe(true)
    })

    it('sets the tiles_loading flag back to false', () => {
      map_model.getState().set_tiles_loading(true)

      map_model.getState().set_tiles_loading(false)

      expect(map_model.getState().tiles_loading).toBe(false)
    })
  })

  describe('reset', () => {
    it('restores every field to its initial default', () => {
      map_model.getState().set_active_map('map-1', [make_tile()])
      map_model.getState().set_mode('build')
      map_model.getState().set_selected_asset({ id: 'asset-1', source: 'default' })
      map_model.getState().set_tokens([make_token()])
      map_model.getState().set_tiles_loading(true)

      map_model.getState().reset()

      expect(map_model.getState()).toMatchObject({
        active_map_id: null,
        tiles: [],
        tokens: [],
        selected_asset: null,
        mode: 'view',
        tiles_loading: false,
      })
    })
  })
})
