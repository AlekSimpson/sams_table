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
})
