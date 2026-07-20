import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { session_model } from '../models/session_model'
import { character_model } from '../models/character_model'
import { map_model } from '../models/map_model'
import { combat_model } from '../models/combat_model'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { SessionJoinResponse } from '../types/app_types'
import { DNDCharacter } from '../types/dnd_types'

// session_api is mocked at the module level (rather than letting calls fall through to the
// mock backend) so every test controls success/failure directly, following the pattern in
// character_viewmodel.test.ts. websocket_hook is mocked so tests can assert on outgoing
// `send` calls without a real WebSocket connection, following map_viewmodel.test.ts.
// react-router-dom's useNavigate is mocked because session_viewmodel() calls it
// unconditionally at the top, even though join_code_model itself never navigates.
const { mock_session_api, mock_send, mock_navigate } = vi.hoisted(() => ({
  mock_session_api: {
    join: vi.fn<(code: string) => Promise<SessionJoinResponse>>(),
  },
  mock_send: vi.fn(),
  mock_navigate: vi.fn(),
}))

vi.mock('../util/rest_client', () => ({
  session_api: mock_session_api,
}))

vi.mock('../util/websockets', () => ({
  websocket_hook: () => ({ send: mock_send }),
}))

vi.mock('react-router-dom', async (import_original) => {
  const actual = await import_original<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mock_navigate }
})

import { session_viewmodel } from './session_viewmodel'

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

function render_join_code_model() {
  return renderHook(() => session_viewmodel().join_code_model())
}

beforeEach(() => {
  session_model.getState().clear_session()
  session_model.getState().set_session(
    'token-123',
    { user_id: 'user-1', campaign_id: 'campaign-x', role: 'player', expiration_time: 0, issued_at: 0 },
    { id: 'user-1', username: 'sam', created_at: '2026-01-01T00:00:00Z' }
  )
  vi.resetAllMocks()
})

describe('join_code_model', () => {
  it('updates the session and broadcasts player_joined when the join code is valid', async () => {
    mock_session_api.join.mockResolvedValue({ campaign_id: 'campaign-1', active_map_id: 'map-1' })
    const { result } = render_join_code_model()

    act(() => {
      result.current.on_join_code_change({ target: { value: 'ABC123' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })

    expect(mock_session_api.join).toHaveBeenCalledWith('ABC123')
    expect(session_model.getState().campaign_id).toBe('campaign-1')
    expect(session_model.getState().active_map_id).toBe('map-1')
    expect(mock_send).toHaveBeenCalledWith('player_joined', {
      campaign_id: 'campaign-1',
      user_id: 'user-1',
      character_name: 'Thorian Ashvale',
    })
    expect(result.current.join_code_draft).toBe('')
    expect(result.current.join_error).toBeNull()
    expect(result.current.is_joining).toBe(false)
  })

  it('sets is_joining while the request is in flight and clears it once it resolves', async () => {
    let resolve_join!: (response: SessionJoinResponse) => void
    mock_session_api.join.mockImplementation(
      () => new Promise<SessionJoinResponse>((resolve) => { resolve_join = resolve })
    )
    const { result } = render_join_code_model()

    act(() => {
      result.current.on_join_code_change({ target: { value: 'ABC123' } } as React.ChangeEvent<HTMLInputElement>)
    })
    let submit_promise!: Promise<void>
    act(() => {
      submit_promise = result.current.on_submit('Thorian Ashvale')
    })

    expect(result.current.is_joining).toBe(true)

    await act(async () => {
      resolve_join({ campaign_id: 'campaign-1', active_map_id: null })
      await submit_promise
    })

    expect(result.current.is_joining).toBe(false)
  })

  it('surfaces an inline error and does not broadcast player_joined when the join code is invalid', async () => {
    mock_session_api.join.mockRejectedValue(new Error('Invalid or expired join code'))
    const { result } = render_join_code_model()

    act(() => {
      result.current.on_join_code_change({ target: { value: 'WRONG1' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })

    expect(result.current.join_error).toBe('Invalid or expired join code')
    expect(result.current.is_joining).toBe(false)
    expect(mock_send).not.toHaveBeenCalled()
    // The failed code stays in the input so the player can see and correct it.
    expect(result.current.join_code_draft).toBe('WRONG1')
  })

  it('clears the inline error as soon as the join code is edited again', async () => {
    mock_session_api.join.mockRejectedValue(new Error('Invalid or expired join code'))
    const { result } = render_join_code_model()

    act(() => {
      result.current.on_join_code_change({ target: { value: 'WRONG1' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })
    expect(result.current.join_error).toBe('Invalid or expired join code')

    act(() => {
      result.current.on_join_code_change({ target: { value: 'WRONG2' } } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.join_error).toBeNull()
  })

  it('succeeds on a retried submit with a corrected join code after a prior failure', async () => {
    mock_session_api.join.mockRejectedValueOnce(new Error('Invalid or expired join code'))
    const { result } = render_join_code_model()

    act(() => {
      result.current.on_join_code_change({ target: { value: 'WRONG1' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })
    expect(result.current.join_error).toBe('Invalid or expired join code')

    mock_session_api.join.mockResolvedValueOnce({ campaign_id: 'campaign-1', active_map_id: null })
    act(() => {
      result.current.on_join_code_change({ target: { value: 'RIGHT1' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })

    expect(result.current.join_error).toBeNull()
    expect(session_model.getState().campaign_id).toBe('campaign-1')
    expect(mock_send).toHaveBeenCalledWith('player_joined', {
      campaign_id: 'campaign-1',
      user_id: 'user-1',
      character_name: 'Thorian Ashvale',
    })
  })

  it('is a no-op when submitting a blank join code', async () => {
    const { result } = render_join_code_model()

    await act(async () => {
      await result.current.on_submit('Thorian Ashvale')
    })

    expect(mock_session_api.join).not.toHaveBeenCalled()
    expect(mock_send).not.toHaveBeenCalled()
  })
})

describe('logout', () => {
  it('clears the session and every other per-session store so a subsequent login does not inherit stale data', () => {
    character_model.getState().set_character(make_character())
    map_model.getState().set_active_map('map-1', [])
    combat_model.getState().set_initiative_order([
      { character_id: 'character-1', name: 'Thorian Ashvale', initiative: 15, is_npc: false },
    ])
    dm_dashboard_model.getState().set_selected_campaign({
      id: 'campaign-1',
      name: 'The Sunken Spire',
      description: '',
      dm_id: 'dm-1',
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => session_viewmodel())
    act(() => {
      result.current.logout()
    })

    expect(session_model.getState().token).toBeNull()
    expect(character_model.getState().characters).toEqual({})
    expect(map_model.getState().active_map_id).toBeNull()
    expect(combat_model.getState().initiative_order).toEqual([])
    expect(dm_dashboard_model.getState().selected_campaign).toBeNull()
  })
})
