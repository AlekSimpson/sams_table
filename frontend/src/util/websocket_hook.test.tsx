// Proves websocket_hook() (see ./websockets.ts) is a genuine per-tab singleton: multiple
// simultaneous callers share one underlying connection, incoming messages are dispatched
// exactly once no matter how many callers are mounted, the shared connection survives a
// partial unmount, gets closed once the last consumer unmounts, and a token change tears
// down the stale connection and opens a fresh one.
import { act, renderHook } from '@testing-library/react'
import { PropsWithChildren, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { combat_model } from '../models/combat_model'
import { session_model } from '../models/session_model'

// Wraps the real MockWebSocket so tests can observe how many underlying connections
// actually get constructed, and inspect each instance's readyState directly — without
// touching mock_websocket.ts itself.
const mock_websocket_construction_state = vi.hoisted(() => ({
  instances: [] as { readyState: number }[],
}))

vi.mock('./mock/mock_websocket', async (import_original) => {
  const actual = await import_original<typeof import('./mock/mock_websocket')>()
  class CountingMockWebSocket extends actual.MockWebSocket {
    constructor(url: string) {
      super(url)
      mock_websocket_construction_state.instances.push(this)
    }
  }
  return { ...actual, MockWebSocket: CountingMockWebSocket }
})

import { MockWebSocket } from './mock/mock_websocket'
import { websocket_hook } from './websockets'

const DICE_ROLL_REQUEST_PAYLOAD = { notation: '1d20', character_id: 'character-1', roller_name: 'Thorian Ashvale' }

// MockWebSocket resolves "connected" (and mock_websocket's hub resolves broadcasts) after
// a simulated 150-400ms network latency; advancing fake timers past the maximum flushes
// both.
async function advance_past_simulated_network_latency() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500)
  })
}

function send_dice_roll_request(send: <T>(type: 'dice_roll_request', payload: T) => void) {
  act(() => {
    send('dice_roll_request', DICE_ROLL_REQUEST_PAYLOAD)
  })
}

describe('websocket_hook singleton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mock_websocket_construction_state.instances = []
    session_model.getState().clear_session()
    combat_model.setState({ initiative_order: [], last_dice_roll_result: null, dice_roll_history: [] })
  })

  afterEach(() => {
    session_model.getState().clear_session()
    vi.useRealTimers()
  })

  it('opens exactly one underlying connection when multiple hook instances are mounted simultaneously', async () => {
    session_model.setState({ token: 'token-a' })

    const hook_a = renderHook(() => websocket_hook())
    const hook_b = renderHook(() => websocket_hook())
    const hook_c = renderHook(() => websocket_hook())

    await advance_past_simulated_network_latency()

    expect(mock_websocket_construction_state.instances).toHaveLength(1)
    hook_a.unmount()
    hook_b.unmount()
    hook_c.unmount()
  })

  it('dispatches one incoming message exactly once, regardless of how many hook instances are mounted', async () => {
    session_model.setState({ token: 'token-a' })

    const hook_a = renderHook(() => websocket_hook())
    const hook_b = renderHook(() => websocket_hook())
    const hook_c = renderHook(() => websocket_hook())
    await advance_past_simulated_network_latency()

    send_dice_roll_request(hook_a.result.current.send)
    await advance_past_simulated_network_latency()

    expect(combat_model.getState().dice_roll_history).toHaveLength(1)

    hook_a.unmount()
    hook_b.unmount()
    hook_c.unmount()
  })

  it('keeps the shared connection open and functional when one of several mounted instances unmounts', async () => {
    session_model.setState({ token: 'token-a' })

    const hook_a = renderHook(() => websocket_hook())
    const hook_b = renderHook(() => websocket_hook())
    await advance_past_simulated_network_latency()

    hook_a.unmount()

    expect(mock_websocket_construction_state.instances[0].readyState).toBe(MockWebSocket.OPEN)

    send_dice_roll_request(hook_b.result.current.send)
    await advance_past_simulated_network_latency()

    expect(combat_model.getState().dice_roll_history).toHaveLength(1)
    expect(mock_websocket_construction_state.instances).toHaveLength(1)

    hook_b.unmount()
  })

  it('closes the underlying connection once the last mounted instance unmounts (no leak)', async () => {
    session_model.setState({ token: 'token-a' })

    const hook_a = renderHook(() => websocket_hook())
    const hook_b = renderHook(() => websocket_hook())
    await advance_past_simulated_network_latency()

    hook_a.unmount()
    hook_b.unmount()

    expect(mock_websocket_construction_state.instances[0].readyState).toBe(MockWebSocket.CLOSED)
  })

  it('tears down the old connection and opens a fresh one when the token changes', async () => {
    session_model.setState({ token: 'token-a' })

    const hook_a = renderHook(() => websocket_hook())
    const hook_b = renderHook(() => websocket_hook())
    await advance_past_simulated_network_latency()

    expect(mock_websocket_construction_state.instances).toHaveLength(1)
    const first_connection = mock_websocket_construction_state.instances[0]

    act(() => {
      session_model.getState().clear_session()
      session_model.setState({ token: 'token-b' })
    })
    await advance_past_simulated_network_latency()

    expect(first_connection.readyState).toBe(MockWebSocket.CLOSED)
    expect(mock_websocket_construction_state.instances).toHaveLength(2)
    expect(mock_websocket_construction_state.instances[1].readyState).toBe(MockWebSocket.OPEN)

    // the fresh connection is still shared correctly across both still-mounted instances.
    send_dice_roll_request(hook_a.result.current.send)
    await advance_past_simulated_network_latency()

    expect(combat_model.getState().dice_roll_history).toHaveLength(1)

    hook_a.unmount()
    hook_b.unmount()
  })

  it('converges on exactly one live connection under React StrictMode\'s dev-mode double-invoke of effects', async () => {
    session_model.setState({ token: 'token-a' })

    const strict_mode_wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>
    const hook_a = renderHook(() => websocket_hook(), { wrapper: strict_mode_wrapper })
    await advance_past_simulated_network_latency()

    // StrictMode's simulated mount -> cleanup -> re-mount discards the first connection
    // it opens; the singleton must not leak that discarded instance and must end up with
    // exactly one live, open connection.
    expect(mock_websocket_construction_state.instances).toHaveLength(2)
    expect(mock_websocket_construction_state.instances[0].readyState).toBe(MockWebSocket.CLOSED)
    expect(mock_websocket_construction_state.instances[1].readyState).toBe(MockWebSocket.OPEN)

    hook_a.unmount()
    expect(mock_websocket_construction_state.instances[1].readyState).toBe(MockWebSocket.CLOSED)
  })
})
