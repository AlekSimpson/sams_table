import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatch_websocket_event } from './websockets'
import { map_model } from '../models/map_model'
import { character_model } from '../models/character_model'
import { combat_model } from '../models/combat_model'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { notification_model } from '../models/notification_model'
import { session_model } from '../models/session_model'
import { WSEnvelope, WSEventType } from '../types/websocket_types'
import { MapTile } from '../types/game_types'
import { DNDCharacter } from '../types/dnd_types'

function make_envelope(type: WSEventType, payload: unknown): WSEnvelope {
  return { type, campaign_id: 'campaign-1', sender_id: 'sender-1', payload, ts: 1 }
}

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

describe('dispatch_websocket_event', () => {
  beforeEach(() => {
    map_model.getState().reset()
    character_model.getState().clear()
    combat_model.setState({ initiative_order: [], last_dice_roll_result: null, dice_roll_history: [] })
    dm_dashboard_model.setState({
      campaigns: [],
      selected_campaign: null,
      session: null,
      active_map_id: null,
      joined_players: [],
    })
    notification_model.setState({ notifications: [] })
    session_model.getState().clear_session()
  })

  it('hp_update calls character_model.update_hp with the payload fields', () => {
    character_model.getState().set_character(make_character({ id: 'character-1', current_hp: 44, max_hp: 44 }))

    dispatch_websocket_event(make_envelope('hp_update', { character_id: 'character-1', current_hp: 10, max_hp: 44 }))

    expect(character_model.getState().characters['character-1']).toMatchObject({ current_hp: 10, max_hp: 44 })
  })

  describe('map_activated', () => {
    it('applies the new map id and tiles when map_id is non-null', () => {
      dispatch_websocket_event(make_envelope('map_activated', { map_id: 'map-2', tiles: [make_tile({ id: 'tile-1' })] }))

      expect(map_model.getState().active_map_id).toBe('map-2')
      expect(map_model.getState().tiles).toEqual([make_tile({ id: 'tile-1' })])
      expect(map_model.getState().tiles_loading).toBe(false)
    })

    it('applies a null map_id (blanks the map) on a player client', () => {
      session_model.setState({ role: 'player' })
      map_model.getState().set_active_map('map-1', [make_tile()])
      map_model.getState().set_tiles_loading(true)

      dispatch_websocket_event(make_envelope('map_activated', { map_id: null, tiles: [] }))

      expect(map_model.getState().active_map_id).toBeNull()
      expect(map_model.getState().tiles).toEqual([])
      expect(map_model.getState().tiles_loading).toBe(false)
    })

    it('guard: ignores a null map_id broadcast on the DM\'s own client', () => {
      session_model.setState({ role: 'dm' })
      map_model.getState().set_active_map('map-1', [make_tile()])

      dispatch_websocket_event(make_envelope('map_activated', { map_id: null, tiles: [] }))

      expect(map_model.getState().active_map_id).toBe('map-1')
      expect(map_model.getState().tiles).toEqual([make_tile()])
    })
  })

  describe('map_tile_placed', () => {
    it('places the tile when tiles_loading is false', () => {
      map_model.getState().set_active_map('map-1', [])
      map_model.getState().set_tiles_loading(false)

      dispatch_websocket_event(
        make_envelope('map_tile_placed', {
          tile_id: 'tile-1',
          asset_id: 'default_floor_stone',
          asset_source: 'default',
          grid_x: 0,
          grid_y: 0,
          grid_z: 0,
          rotation_y: 0,
        })
      )

      expect(map_model.getState().tiles).toEqual([make_tile({ id: 'tile-1', map_id: 'map-1' })])
    })

    it('guard: is a no-op while tiles_loading is true', () => {
      map_model.getState().set_active_map('map-1', [])
      map_model.getState().set_tiles_loading(true)

      dispatch_websocket_event(
        make_envelope('map_tile_placed', {
          tile_id: 'tile-1',
          asset_id: 'default_floor_stone',
          asset_source: 'default',
          grid_x: 0,
          grid_y: 0,
          grid_z: 0,
          rotation_y: 0,
        })
      )

      expect(map_model.getState().tiles).toEqual([])
    })
  })

  describe('map_tile_removed', () => {
    it('removes the tile when tiles_loading is false', () => {
      map_model.getState().set_active_map('map-1', [make_tile({ id: 'tile-1' })])
      map_model.getState().set_tiles_loading(false)

      dispatch_websocket_event(make_envelope('map_tile_removed', { tile_id: 'tile-1' }))

      expect(map_model.getState().tiles).toEqual([])
    })

    it('guard: is a no-op while tiles_loading is true', () => {
      map_model.getState().set_active_map('map-1', [make_tile({ id: 'tile-1' })])
      map_model.getState().set_tiles_loading(true)

      dispatch_websocket_event(make_envelope('map_tile_removed', { tile_id: 'tile-1' }))

      expect(map_model.getState().tiles).toEqual([make_tile({ id: 'tile-1' })])
    })
  })

  describe('token_moved', () => {
    it('moves the token when tiles_loading is false', () => {
      map_model.getState().set_tokens([{ id: 'token-1', character_id: 'character-1', grid_x: 0, grid_y: 0 }])
      map_model.getState().set_tiles_loading(false)

      dispatch_websocket_event(
        make_envelope('token_moved', { token_id: 'token-1', character_id: 'character-1', grid_x: 5, grid_y: 5 })
      )

      expect(map_model.getState().tokens).toEqual([{ id: 'token-1', character_id: 'character-1', grid_x: 5, grid_y: 5 }])
    })

    it('guard: is a no-op while tiles_loading is true', () => {
      map_model.getState().set_tokens([{ id: 'token-1', character_id: 'character-1', grid_x: 0, grid_y: 0 }])
      map_model.getState().set_tiles_loading(true)

      dispatch_websocket_event(
        make_envelope('token_moved', { token_id: 'token-1', character_id: 'character-1', grid_x: 5, grid_y: 5 })
      )

      expect(map_model.getState().tokens).toEqual([{ id: 'token-1', character_id: 'character-1', grid_x: 0, grid_y: 0 }])
    })
  })

  it('condition_update calls character_model.update_conditions with the payload conditions', () => {
    character_model.getState().set_character(make_character({ id: 'character-1', conditions: [] }))

    dispatch_websocket_event(make_envelope('condition_update', { character_id: 'character-1', conditions: ['poisoned'] }))

    expect(character_model.getState().characters['character-1'].conditions).toEqual(['poisoned'])
  })

  it('initiative_update calls combat_model.set_initiative_order with the ordered entries', () => {
    const entries = [{ character_id: 'character-1', name: 'Thorian Ashvale', initiative: 15, is_npc: false }]

    dispatch_websocket_event(make_envelope('initiative_update', { ordered_entries: entries }))

    expect(combat_model.getState().initiative_order).toEqual(entries)
  })

  it('dice_roll_result sets last_dice_roll_result and appends it to dice_roll_history', () => {
    const result = { roller_id: 'character-1', roller_name: 'Thorian Ashvale', dice: '1d20', results: [15], total: 15 }

    dispatch_websocket_event(make_envelope('dice_roll_result', result))

    expect(combat_model.getState().last_dice_roll_result).toEqual(result)
    expect(combat_model.getState().dice_roll_history).toEqual([result])
  })

  it('visibility_toggle does not mutate any store (unhandled — TODO in source)', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const combat_state_before = combat_model.getState()

    dispatch_websocket_event(make_envelope('visibility_toggle', { target_player_id: 'user-1', visible: false }))

    expect(combat_model.getState()).toBe(combat_state_before)
  })

  it('dice_roll_request is not dispatched to any store (server-bound event, falls through to default)', () => {
    const console_warn_spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const combat_state_before = combat_model.getState()

    dispatch_websocket_event(
      make_envelope('dice_roll_request', { notation: '1d20', character_id: 'character-1', roller_name: 'Thorian Ashvale' })
    )

    expect(combat_model.getState()).toBe(combat_state_before)
    expect(console_warn_spy).toHaveBeenCalled()
  })

  describe('player_joined', () => {
    it('adds the joined player to dm_dashboard_model when the client is a DM', () => {
      session_model.setState({ role: 'dm' })

      dispatch_websocket_event(
        make_envelope('player_joined', { campaign_id: 'campaign-1', user_id: 'user-1', character_name: 'Thorian Ashvale' })
      )

      expect(dm_dashboard_model.getState().joined_players).toEqual([
        { user_id: 'user-1', character_name: 'Thorian Ashvale' },
      ])
    })

    it('guard: does not mutate dm_dashboard_model when the client is not a DM', () => {
      session_model.setState({ role: 'player' })
      const dm_dashboard_state_before = dm_dashboard_model.getState()

      dispatch_websocket_event(
        make_envelope('player_joined', { campaign_id: 'campaign-1', user_id: 'user-1', character_name: 'Thorian Ashvale' })
      )

      expect(dm_dashboard_model.getState()).toBe(dm_dashboard_state_before)
    })
  })

  describe('player_left', () => {
    it('removes the player from dm_dashboard_model when the client is a DM', () => {
      session_model.setState({ role: 'dm' })
      dm_dashboard_model.getState().add_joined_player({ user_id: 'user-1', character_name: 'Thorian Ashvale' })

      dispatch_websocket_event(make_envelope('player_left', { campaign_id: 'campaign-1', user_id: 'user-1' }))

      expect(dm_dashboard_model.getState().joined_players).toEqual([])
    })

    it('guard: does not mutate dm_dashboard_model when the client is not a DM', () => {
      session_model.setState({ role: 'dm' })
      dm_dashboard_model.getState().add_joined_player({ user_id: 'user-1', character_name: 'Thorian Ashvale' })
      session_model.setState({ role: 'player' })
      const dm_dashboard_state_before = dm_dashboard_model.getState()

      dispatch_websocket_event(make_envelope('player_left', { campaign_id: 'campaign-1', user_id: 'user-1' }))

      expect(dm_dashboard_model.getState()).toBe(dm_dashboard_state_before)
    })
  })

  describe('notification side effects', () => {
    it('hp_update adds a notification with the character name and HP delta when the character is known', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', name: 'Thorian Ashvale', current_hp: 44, max_hp: 44 }))

      dispatch_websocket_event(make_envelope('hp_update', { character_id: 'character-1', current_hp: 10, max_hp: 44 }))

      expect(notification_model.getState().notifications).toHaveLength(1)
      expect(notification_model.getState().notifications[0]).toMatchObject({
        message: 'Thorian Ashvale HP: 44 → 10',
        variant: 'info',
      })
    })

    it('hp_update falls back to a nameless message when the character is not in the store', () => {
      dispatch_websocket_event(make_envelope('hp_update', { character_id: 'unknown-character', current_hp: 5, max_hp: 20 }))

      expect(notification_model.getState().notifications[0].message).toBe('HP updated: 5/20')
    })

    it('condition_update adds a notification summarizing the new conditions', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', conditions: [] }))

      dispatch_websocket_event(make_envelope('condition_update', { character_id: 'character-1', conditions: ['poisoned', 'prone'] }))

      expect(notification_model.getState().notifications[0].message).toBe('Conditions updated: poisoned, prone')
    })

    it('dice_roll_result adds a notification describing the roll', () => {
      dispatch_websocket_event(
        make_envelope('dice_roll_result', { roller_id: 'character-1', roller_name: 'Thorian Ashvale', dice: '1d20', results: [15], total: 15 })
      )

      expect(notification_model.getState().notifications[0].message).toBe('Thorian Ashvale rolled 1d20: 15')
    })

    it('player_joined adds a notification regardless of role', () => {
      session_model.setState({ role: 'player' })

      dispatch_websocket_event(
        make_envelope('player_joined', { campaign_id: 'campaign-1', user_id: 'user-1', character_name: 'Thorian Ashvale' })
      )

      expect(notification_model.getState().notifications[0].message).toBe('Thorian Ashvale joined the session')
    })

    it('player_left adds a fallback notification (the payload has no character name)', () => {
      dispatch_websocket_event(make_envelope('player_left', { campaign_id: 'campaign-1', user_id: 'user-1' }))

      expect(notification_model.getState().notifications[0].message).toBe('A player left the session')
    })

    it('map_tile_placed adds a "Tile placed" notification when the tile is applied', () => {
      map_model.getState().set_active_map('map-1', [])
      map_model.getState().set_tiles_loading(false)

      dispatch_websocket_event(
        make_envelope('map_tile_placed', {
          tile_id: 'tile-1',
          asset_id: 'default_floor_stone',
          asset_source: 'default',
          grid_x: 0,
          grid_y: 0,
          grid_z: 0,
          rotation_y: 0,
        })
      )

      expect(notification_model.getState().notifications[0]).toMatchObject({ message: 'Tile placed', variant: 'success' })
    })

    it('map_tile_placed does not add a notification while tiles_loading is true', () => {
      map_model.getState().set_active_map('map-1', [])
      map_model.getState().set_tiles_loading(true)

      dispatch_websocket_event(
        make_envelope('map_tile_placed', {
          tile_id: 'tile-1',
          asset_id: 'default_floor_stone',
          asset_source: 'default',
          grid_x: 0,
          grid_y: 0,
          grid_z: 0,
          rotation_y: 0,
        })
      )

      expect(notification_model.getState().notifications).toEqual([])
    })
  })
})
