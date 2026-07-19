// MODEL layer — singleton WS connection. Used by viewmodels, not Views directly.
// websocket_hook() is a genuine per-tab singleton: module-level state below (see
// shared_websocket_connection/active_consumer_count) holds the one real connection, and
// every websocket_hook() call acquires/releases a reference to it rather than opening its
// own socket. See acquire_shared_websocket_connection/release_shared_websocket_connection.
import { useCallback, useEffect } from 'react'
import { session_model } from '../models/session_model'
import { map_model } from '../models/map_model'
import { character_model } from '../models/character_model'
import { combat_model } from '../models/combat_model'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { notification_model } from '../models/notification_model'
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
  DiceRollResultPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload
} from '../types/websocket_types'

// Exported for unit testing (see websockets.test.ts) — not used outside this module otherwise.
export function dispatch_websocket_event(envelope: WSEnvelope) {
  // routes incoming WS events to the appropriate store actions.
  const map_state = map_model.getState()
  const character_state = character_model.getState()
  const combat_state = combat_model.getState()
  const dm_dashboard_state = dm_dashboard_model.getState()
  const notification_state = notification_model.getState()
  const is_dm = session_model.getState().role === 'dm'

  switch (envelope.type as WSEventType) {
    case 'hp_update': {
      const p = envelope.payload as HPUpdatePayload
      // Captured before update_hp mutates the store, so this still reflects the
      // pre-update character (name + previous HP) for the notification message below.
      const character_before_update = character_state.characters[p.character_id]
      character_state.update_hp(p.character_id, p.current_hp, p.max_hp)
      const hp_change_message = character_before_update
        ? `${character_before_update.name} HP: ${character_before_update.current_hp} → ${p.current_hp}`
        : `HP updated: ${p.current_hp}/${p.max_hp}`
      notification_state.add_notification(hp_change_message, 'info')
      break
    }
    case 'map_activated': {
      const p = envelope.payload as MapActivatedPayload
      // A null map_id is the DM's "hide map from players" broadcast. It's meant
      // to blank players' view only — the DM's own dashboard renders whichever
      // map is selected in dm_dashboard_model.active_map_id, independent of this
      // broadcast, so skip applying it on the DM's own client (otherwise the DM
      // would blank its own map when its own broadcast echoes back to it).
      if (p.map_id === null && is_dm) break
      // This payload is a full, authoritative tile snapshot for the newly
      // activated map, so it always applies immediately — it also supersedes
      // any in-flight REST load_map for a different map (see map_viewmodel.ts's
      // load_map, which checks active_map_id before applying its own response)
      // and clears tiles_loading so a stale REST call finishing later doesn't
      // leave the UI stuck showing a loading state.
      map_state.set_active_map(p.map_id, p.tiles)
      map_state.set_tiles_loading(false)
      break
    }
    case 'map_tile_placed': {
      // Ignore tile events that arrive while the initial REST load for the
      // active map is still in flight: load_map's response will already
      // reflect the latest persisted tiles once it resolves, so applying this
      // event now would just be clobbered (or duplicate a pending optimistic
      // update) when that response lands.
      if (map_state.tiles_loading) break
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
      notification_state.add_notification('Tile placed', 'success')
      break
    }
    case 'map_tile_removed': {
      if (map_state.tiles_loading) break
      const p = envelope.payload as MapTileRemovedPayload
      map_state.remove_tile(p.tile_id)
      break
    }
    case 'token_moved': {
      // Same race as map_tile_placed/removed above: the initial REST load_map call
      // (see map_viewmodel.ts) also fetches tokens, so drop events that arrive before
      // it resolves rather than applying them to a token list that's about to be
      // overwritten by that response.
      if (map_state.tiles_loading) break
      const p = envelope.payload as TokenMovedPayload
      map_state.move_token(p.token_id, p.grid_x, p.grid_y)
      break
    }
    case 'condition_update': {
      const p = envelope.payload as ConditionUpdatePayload
      character_state.update_conditions(p.character_id, p.conditions)
      const condition_summary = p.conditions.length > 0 ? p.conditions.join(', ') : 'none'
      notification_state.add_notification(`Conditions updated: ${condition_summary}`, 'info')
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
      notification_state.add_notification(`${p.roller_name} rolled ${p.dice}: ${p.total}`, 'info')
      break
    }
    case 'visibility_toggle':
      // TODO: route to combat store when implemented
      console.log('ws event (unhandled):', envelope.type, envelope.payload)
      break
    case 'player_joined': {
      const p = envelope.payload as PlayerJoinedPayload
      notification_state.add_notification(`${p.character_name} joined the session`, 'success')
      // Presence list is DM-only UI (see dm_dashboard_model.joined_players); skip on
      // player clients so this doesn't mutate a store nothing renders for them.
      if (!is_dm) break
      dm_dashboard_state.add_joined_player({ user_id: p.user_id, character_name: p.character_name })
      break
    }
    case 'player_left': {
      // PlayerLeftPayload only carries user_id (no character name), so the notification
      // falls back to a generic message rather than a per-player-name one.
      notification_state.add_notification('A player left the session', 'info')
      if (!is_dm) break
      const p = envelope.payload as PlayerLeftPayload
      dm_dashboard_state.remove_joined_player(p.user_id)
      break
    }
    default:
      console.warn('ws: unknown event type:', envelope.type)
  }
}

interface SharedWebsocketConnection {
  socket: WebSocket
  token: string
}

// Module-level singleton state: at most one real connection open per browser tab,
// shared by every websocket_hook() caller. active_consumer_count tracks how many
// mounted hook instances currently hold a reference to it, so the connection is
// only closed once the last consumer unmounts (see acquire/release below).
let shared_websocket_connection: SharedWebsocketConnection | null = null
let active_consumer_count = 0

function open_shared_websocket_connection(token: string): SharedWebsocketConnection {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const websocket_url = `${protocol}//${window.location.host}/ws?token=${token}`
  // MockWebSocket implements the subset of the WebSocket interface used below
  // (onopen/onclose/onerror/onmessage/send/close/readyState); the cast keeps the
  // mock swap contained to this one line. See ./mock/mock_websocket.ts.
  const socket = (MOCK_MODE_ENABLED ? new MockWebSocket(websocket_url) : new WebSocket(websocket_url)) as unknown as WebSocket

  socket.onopen = () => console.log('ws: connected')
  socket.onclose = () => console.log('ws: disconnected')
  socket.onerror = (err) => console.error('ws: error', err)
  // Single onmessage handler for the whole tab: dispatch_websocket_event runs exactly
  // once per incoming message, no matter how many components called websocket_hook().
  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const envelope = JSON.parse(event.data) as WSEnvelope
      dispatch_websocket_event(envelope)
    } catch (err) {
      console.error('ws: parse error', err)
    }
  }

  const connection: SharedWebsocketConnection = { socket, token }
  shared_websocket_connection = connection
  return connection
}

// Acquires a reference to the shared connection for `token`, opening it if this is the
// first consumer or if `token` differs from the connection currently open (e.g. a logout
// followed by a different login) — the stale connection is torn down first in that case.
// Returns the connection instance so the caller's cleanup can release that exact instance
// (see release_shared_websocket_connection) rather than whatever happens to be current at
// cleanup time, which keeps ref-counting correct no matter what order multiple simultaneous
// websocket_hook() consumers' effects run in.
function acquire_shared_websocket_connection(token: string): SharedWebsocketConnection {
  if (shared_websocket_connection && shared_websocket_connection.token !== token) {
    shared_websocket_connection.socket.close()
    shared_websocket_connection = null
    active_consumer_count = 0
  }
  const connection = shared_websocket_connection ?? open_shared_websocket_connection(token)
  active_consumer_count += 1
  return connection
}

// Releases this consumer's reference to `connection`; closes the shared connection only
// once the last consumer has released it. A no-op if `connection` has already been
// replaced/torn down (e.g. a token change already swapped it out from under this consumer).
function release_shared_websocket_connection(connection: SharedWebsocketConnection): void {
  if (shared_websocket_connection !== connection) return
  active_consumer_count = Math.max(0, active_consumer_count - 1)
  if (active_consumer_count === 0) {
    connection.socket.close()
    shared_websocket_connection = null
  }
}

export function websocket_hook() {
  const token = session_model((state) => state.token)

  useEffect(() => {
    if (!token) return

    const connection = acquire_shared_websocket_connection(token)
    return () => release_shared_websocket_connection(connection)
  }, [token])

  // send a typed WS event to the server. No-op if not connected.
  const send = useCallback(<T>(type: WSEventType, payload: T) => {
    if (shared_websocket_connection?.socket.readyState === WebSocket.OPEN) {
      const envelope: Partial<WSEnvelope<T>> = { type, payload }
      shared_websocket_connection.socket.send(JSON.stringify(envelope))
    } else {
      console.warn('ws: not connected — dropping event:', type)
    }
  }, [])

  return { send }
}
