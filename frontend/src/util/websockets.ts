// MODEL layer — singleton WS connection. Used by viewmodels, not Views directly.
import { useCallback, useEffect, useRef } from 'react'
import { session_model } from '../models/session_model'
import { map_model } from '../models/map_model'
import { character_model } from '../models/character_model'
import { combat_model } from '../models/combat_model'
import { WSEnvelope, WSEventType } from '../types/websocket_types'
import { MOCK_MODE_ENABLED } from './mock/mock_config'
import { MockWebSocket } from './mock/mock_websocket'
import {
  HPUpdatePayload,
  MapActivatedPayload,
  MapTilePlacedPayload,
  MapTileRemovedPayload,
  TokenMovedPayload,
  ConditionUpdatePayload,
  InitiativeUpdatePayload,
  DiceRollResultPayload
} from '../types/websocket_types'

function dispatch_websocket_event(envelope: WSEnvelope) {
  // routes incoming WS events to the appropriate store actions.
  const map_state = map_model.getState()
  const character_state = character_model.getState()
  const combat_state = combat_model.getState()

  switch (envelope.type as WSEventType) {
    case 'hp_update': {
      const p = envelope.payload as HPUpdatePayload
      character_state.update_hp(p.character_id, p.current_hp, p.max_hp)
      break
    }
    case 'map_activated': {
      const p = envelope.payload as MapActivatedPayload
      map_state.set_active_map(p.map_id, p.tiles)
      break
    }
    case 'map_tile_placed': {
      const p = envelope.payload as MapTilePlacedPayload
      // Shape payload into a MapTile and place it
      map_state.place_tile({
        id: p.tile_id,
        map_id: map_state.active_map_id ?? '',
        asset_id: p.asset_id,
        asset_source: p.asset_source as 'default' | 'uploaded',
        grid_x: p.grid_x,
        grid_y: p.grid_y,
        grid_z: p.grid_z,
        rotation_y: p.rotation_y,
      })
      break
    }
    case 'map_tile_removed': {
      const p = envelope.payload as MapTileRemovedPayload
      map_state.remove_tile(p.tile_id)
      break
    }
    case 'token_moved': {
      const p = envelope.payload as TokenMovedPayload
      map_state.move_token(p.token_id, p.grid_x, p.grid_y)
      break
    }
    case 'condition_update': {
      const p = envelope.payload as ConditionUpdatePayload
      character_state.update_conditions(p.character_id, p.conditions)
      break
    }
    case 'initiative_update': {
      const p = envelope.payload as InitiativeUpdatePayload
      combat_state.set_initiative_order(p.ordered_entries)
      break
    }
    case 'dice_roll_result': {
      const p = envelope.payload as DiceRollResultPayload
      combat_state.set_last_dice_roll_result(p)
      combat_state.add_dice_roll_result(p)
      break
    }
    case 'visibility_toggle':
      // TODO: route to combat store when implemented
      console.log('ws event (unhandled):', envelope.type, envelope.payload)
      break
    default:
      console.warn('ws: unknown event type:', envelope.type)
  }
}

export function websocket_hook() {
  const websocket_reference = useRef<WebSocket | null>(null)
  const token = session_model((state) => state.token)

  useEffect(() => {
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const websocket_url = `${protocol}//${window.location.host}/ws?token=${token}`
    // MockWebSocket implements the subset of the WebSocket interface used below
    // (onopen/onclose/onerror/onmessage/send/close/readyState); the cast keeps the
    // mock swap contained to this one line. See ./mock/mock_websocket.ts.
    const ws = (MOCK_MODE_ENABLED ? new MockWebSocket(websocket_url) : new WebSocket(websocket_url)) as unknown as WebSocket
    websocket_reference.current = ws

    ws.onopen = () => console.log('ws: connected')
    ws.onclose = () => console.log('ws: disconnected')
    ws.onerror = (err) => console.error('ws: error', err)
    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const envelope = JSON.parse(event.data) as WSEnvelope
        dispatch_websocket_event(envelope)
      } catch (err) {
        console.error('ws: parse error', err)
      }
    }

    return () => ws.close()
  }, [token])

  // send a typed WS event to the server. No-op if not connected.
  const send = useCallback(<T>(type: WSEventType, payload: T) => {
    if (websocket_reference.current?.readyState === WebSocket.OPEN) {
      const envelope: Partial<WSEnvelope<T>> = { type, payload }
      websocket_reference.current.send(JSON.stringify(envelope))
    } else {
      console.warn('ws: not connected — dropping event:', type)
    }
  }, [])

  return { send }
}
