// In-memory WebSocket adapter simulating a single-room server hub. Swapped in for
// `new WebSocket(...)` inside websocket_hook() (see ../websockets.ts) when the mock
// backend is enabled. Implements the interface surface websockets.ts actually uses:
// onopen/onclose/onerror/onmessage/send/close/readyState.
import { DiceRollRequestPayload, DiceRollResultPayload, WSEnvelope, WSEventType } from '../../types/websocket_types'
import { simulate_network_latency } from './mock_config'
import { DEMO_CAMPAIGN_ID } from './fixtures'

const READY_STATE_CONNECTING = 0
const READY_STATE_OPEN = 1
const READY_STATE_CLOSING = 2
const READY_STATE_CLOSED = 3

const connected_sockets: MockWebSocket[] = []

function extract_user_id_from_token(url: string): string {
  try {
    const token = new URL(url, window.location.origin).searchParams.get('token')
    if (!token) return 'mock-user'
    const claims = JSON.parse(atob(token.split('.')[1])) as { user_id?: string }
    return claims.user_id ?? 'mock-user'
  } catch {
    return 'mock-user'
  }
}

function roll_dice_notation(notation: string): { results: number[]; total: number } {
  const match = /^(\d+)d(\d+)([+-]\d+)?$/i.exec(notation.trim())
  const dice_count = match ? parseInt(match[1], 10) : 1
  const dice_sides = match ? parseInt(match[2], 10) : 20
  const modifier = match && match[3] ? parseInt(match[3], 10) : 0

  const results = Array.from({ length: dice_count }, () => Math.floor(Math.random() * dice_sides) + 1)
  const total = results.reduce((sum, roll) => sum + roll, 0) + modifier
  return { results, total }
}

/** Broadcasts an envelope to every mock socket currently connected in this tab. */
async function broadcast_envelope(envelope: WSEnvelope): Promise<void> {
  await simulate_network_latency()
  for (const socket of connected_sockets) {
    if (socket.readyState === READY_STATE_OPEN) {
      socket.onmessage?.({ data: JSON.stringify(envelope) } as MessageEvent<string>)
    }
  }
}

export class MockWebSocket {
  static readonly CONNECTING = READY_STATE_CONNECTING
  static readonly OPEN = READY_STATE_OPEN
  static readonly CLOSING = READY_STATE_CLOSING
  static readonly CLOSED = READY_STATE_CLOSED

  readyState: number = READY_STATE_CONNECTING
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((error: unknown) => void) | null = null
  onmessage: ((event: MessageEvent<string>) => void) | null = null

  private readonly sender_id: string

  constructor(url: string) {
    this.sender_id = extract_user_id_from_token(url)
    connected_sockets.push(this)
    simulate_network_latency().then(() => {
      if (this.readyState === READY_STATE_CLOSED) return
      this.readyState = READY_STATE_OPEN
      this.onopen?.()
    })
  }

  send(data: string): void {
    if (this.readyState !== READY_STATE_OPEN) return

    let parsed_envelope: Partial<WSEnvelope>
    try {
      parsed_envelope = JSON.parse(data) as Partial<WSEnvelope>
    } catch {
      return
    }
    if (!parsed_envelope.type) return

    if (parsed_envelope.type === 'dice_roll_request') {
      const request_payload = parsed_envelope.payload as DiceRollRequestPayload
      const { results, total } = roll_dice_notation(request_payload.notation)
      const result_payload: DiceRollResultPayload = {
        roller_id: request_payload.character_id,
        roller_name: request_payload.roller_name,
        dice: request_payload.notation,
        results,
        total,
      }
      void broadcast_envelope({
        type: 'dice_roll_result',
        campaign_id: DEMO_CAMPAIGN_ID,
        sender_id: this.sender_id,
        payload: result_payload,
        ts: Date.now(),
      })
      return
    }

    void broadcast_envelope({
      type: parsed_envelope.type as WSEventType,
      campaign_id: DEMO_CAMPAIGN_ID,
      sender_id: this.sender_id,
      payload: parsed_envelope.payload,
      ts: Date.now(),
    })
  }

  close(): void {
    this.readyState = READY_STATE_CLOSED
    const index = connected_sockets.indexOf(this)
    if (index !== -1) connected_sockets.splice(index, 1)
    this.onclose?.()
  }
}
