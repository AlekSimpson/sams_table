// Smoke test proving the Vitest harness runs and can exercise a Zustand model.
import { describe, expect, it, beforeEach } from 'vitest'
import { session_model } from './session_model'
import { JWTClaims, User } from '../types/app_types'

describe('session_model', () => {
  beforeEach(() => {
    session_model.getState().clear_session()
  })

  it('set_session stores the token, user, and role from the given claims', () => {
    const user: User = { id: 'user-1', username: 'sam', created_at: '2026-01-01T00:00:00Z' }
    const claims: JWTClaims = {
      user_id: 'user-1',
      campaign_id: 'campaign-1',
      role: 'dm',
      expiration_time: 0,
      issued_at: 0,
    }

    session_model.getState().set_session('token-123', claims, user)

    expect(session_model.getState().token).toBe('token-123')
    expect(session_model.getState().user).toEqual(user)
    expect(session_model.getState().role).toBe('dm')
  })

  it('clear_session resets the token back to null', () => {
    session_model.getState().clear_session()

    expect(session_model.getState().token).toBeNull()
  })

  it('set_session defaults character_id to null when claims omit it', () => {
    const user: User = { id: 'user-2', username: 'player_demo', created_at: '2026-01-01T00:00:00Z' }
    const claims: JWTClaims = {
      user_id: 'user-2',
      campaign_id: 'campaign-1',
      role: 'player',
      expiration_time: 0,
      issued_at: 0,
    }

    session_model.getState().set_session('token-456', claims, user)

    expect(session_model.getState().character_id).toBeNull()
  })

  it('set_session stores character_id from claims when present', () => {
    const user: User = { id: 'user-2', username: 'player_demo', created_at: '2026-01-01T00:00:00Z' }
    const claims: JWTClaims = {
      user_id: 'user-2',
      campaign_id: 'campaign-1',
      role: 'player',
      character_id: 'character-1',
      expiration_time: 0,
      issued_at: 0,
    }

    session_model.getState().set_session('token-456', claims, user)

    expect(session_model.getState().character_id).toBe('character-1')
  })

  it('clear_session resets every session field, not just the token', () => {
    const user: User = { id: 'user-1', username: 'sam', created_at: '2026-01-01T00:00:00Z' }
    const claims: JWTClaims = {
      user_id: 'user-1',
      campaign_id: 'campaign-1',
      role: 'dm',
      character_id: 'character-1',
      expiration_time: 0,
      issued_at: 0,
    }
    session_model.getState().set_session('token-123', claims, user)
    session_model.getState().set_campaign_session('campaign-1', 'map-1')

    session_model.getState().clear_session()

    expect(session_model.getState()).toMatchObject({
      token: null,
      user: null,
      role: null,
      campaign_id: null,
      character_id: null,
      active_map_id: null,
    })
  })

  describe('set_campaign_session', () => {
    it('sets the campaign_id and active_map_id', () => {
      session_model.getState().set_campaign_session('campaign-1', 'map-1')

      expect(session_model.getState().campaign_id).toBe('campaign-1')
      expect(session_model.getState().active_map_id).toBe('map-1')
    })

    it('accepts a null active_map_id', () => {
      session_model.getState().set_campaign_session('campaign-1', null)

      expect(session_model.getState().campaign_id).toBe('campaign-1')
      expect(session_model.getState().active_map_id).toBeNull()
    })
  })
})
