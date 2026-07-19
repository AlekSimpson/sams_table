import { describe, expect, it, beforeEach } from 'vitest'
import { dm_dashboard_model } from './dm_dashboard_model'
import { DNDCampaign } from '../types/dnd_types'
import { JoinedPlayer } from '../types/app_types'

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

function make_joined_player(overrides: Partial<JoinedPlayer> = {}): JoinedPlayer {
  return {
    user_id: 'user-1',
    character_name: 'Thorian Ashvale',
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

describe('dm_dashboard_model', () => {
  beforeEach(() => {
    dm_dashboard_model.setState(INITIAL_STATE)
  })

  describe('set_campaigns', () => {
    it('replaces the entire campaign list', () => {
      dm_dashboard_model.getState().add_campaign(make_campaign({ id: 'stale-campaign' }))

      const campaigns = [make_campaign({ id: 'campaign-1' }), make_campaign({ id: 'campaign-2' })]
      dm_dashboard_model.getState().set_campaigns(campaigns)

      expect(dm_dashboard_model.getState().campaigns).toEqual(campaigns)
    })
  })

  describe('add_campaign', () => {
    it('appends a campaign to the existing list', () => {
      const existing_campaign = make_campaign({ id: 'campaign-1' })
      dm_dashboard_model.getState().set_campaigns([existing_campaign])

      const new_campaign = make_campaign({ id: 'campaign-2' })
      dm_dashboard_model.getState().add_campaign(new_campaign)

      expect(dm_dashboard_model.getState().campaigns).toEqual([existing_campaign, new_campaign])
    })
  })

  describe('set_selected_campaign', () => {
    it('sets the selected campaign', () => {
      const campaign = make_campaign()

      dm_dashboard_model.getState().set_selected_campaign(campaign)

      expect(dm_dashboard_model.getState().selected_campaign).toEqual(campaign)
    })

    it('clears the selected campaign with null', () => {
      dm_dashboard_model.getState().set_selected_campaign(make_campaign())

      dm_dashboard_model.getState().set_selected_campaign(null)

      expect(dm_dashboard_model.getState().selected_campaign).toBeNull()
    })
  })

  describe('set_session', () => {
    it('sets the active session', () => {
      dm_dashboard_model.getState().set_session({ join_code: 'ABC123' })

      expect(dm_dashboard_model.getState().session).toEqual({ join_code: 'ABC123' })
    })

    it('clears the session with null', () => {
      dm_dashboard_model.getState().set_session({ join_code: 'ABC123' })

      dm_dashboard_model.getState().set_session(null)

      expect(dm_dashboard_model.getState().session).toBeNull()
    })
  })

  describe('set_active_map_id', () => {
    it('sets the active map id', () => {
      dm_dashboard_model.getState().set_active_map_id('map-1')

      expect(dm_dashboard_model.getState().active_map_id).toBe('map-1')
    })

    it('clears the active map id with null', () => {
      dm_dashboard_model.getState().set_active_map_id('map-1')

      dm_dashboard_model.getState().set_active_map_id(null)

      expect(dm_dashboard_model.getState().active_map_id).toBeNull()
    })
  })

  describe('add_joined_player', () => {
    it('adds a new joined player', () => {
      const player = make_joined_player({ user_id: 'user-1' })

      dm_dashboard_model.getState().add_joined_player(player)

      expect(dm_dashboard_model.getState().joined_players).toEqual([player])
    })

    it('does not add a duplicate entry for a user_id that already joined', () => {
      const first_join = make_joined_player({ user_id: 'user-1', character_name: 'Thorian Ashvale' })
      dm_dashboard_model.getState().add_joined_player(first_join)

      const duplicate_join = make_joined_player({ user_id: 'user-1', character_name: 'Renamed Character' })
      dm_dashboard_model.getState().add_joined_player(duplicate_join)

      expect(dm_dashboard_model.getState().joined_players).toEqual([first_join])
    })

    it('adds a second entry for a different user_id', () => {
      const player_one = make_joined_player({ user_id: 'user-1' })
      const player_two = make_joined_player({ user_id: 'user-2' })
      dm_dashboard_model.getState().add_joined_player(player_one)

      dm_dashboard_model.getState().add_joined_player(player_two)

      expect(dm_dashboard_model.getState().joined_players).toEqual([player_one, player_two])
    })
  })

  describe('remove_joined_player', () => {
    it('removes the player with the given user_id', () => {
      const player = make_joined_player({ user_id: 'user-1' })
      dm_dashboard_model.getState().add_joined_player(player)

      dm_dashboard_model.getState().remove_joined_player('user-1')

      expect(dm_dashboard_model.getState().joined_players).toEqual([])
    })

    it('is a no-op when the user_id is not present', () => {
      const player = make_joined_player({ user_id: 'user-1' })
      dm_dashboard_model.getState().add_joined_player(player)

      dm_dashboard_model.getState().remove_joined_player('nonexistent-user')

      expect(dm_dashboard_model.getState().joined_players).toEqual([player])
    })
  })

  describe('clear_joined_players', () => {
    it('resets the joined players list to empty', () => {
      dm_dashboard_model.getState().add_joined_player(make_joined_player({ user_id: 'user-1' }))
      dm_dashboard_model.getState().add_joined_player(make_joined_player({ user_id: 'user-2' }))

      dm_dashboard_model.getState().clear_joined_players()

      expect(dm_dashboard_model.getState().joined_players).toEqual([])
    })
  })
})
