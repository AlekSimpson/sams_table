// VIEWMODEL layer — combat/initiative/dice logic. The only combat-related import Views need.
import { useCallback, useState } from 'react'
import { InitiativeEntry, InitiativeUpdatePayload } from '../types/websocket_types'
import { combat_model } from '../models/combat_model'
import { websocket_hook } from '../util/websockets'

export function combat_viewmodel() {
  const { initiative_order } = combat_model()
  const [active_turn_index, set_active_turn_index] = useState(0)
  const { send } = websocket_hook()

  /** DM: sort and broadcast the initiative order. The order itself is applied locally
   *  when the resulting `initiative_update` event round-trips back over the WS
   *  connection (see dispatch_websocket_event in util/websockets.ts). */
  const set_initiative = useCallback(
    (entries: InitiativeEntry[]) => {
      const sorted = [...entries].sort((a, b) => b.initiative - a.initiative)
      send<InitiativeUpdatePayload>('initiative_update', { ordered_entries: sorted })
    },
    [send]
  )

  /** Advance to the next combatant in initiative order. */
  const advance_turn = useCallback(() => {
    set_active_turn_index((i) => (i + 1) % Math.max(initiative_order.length, 1))
  }, [initiative_order.length])

  /** Send a dice roll request to the server (server rolls with crypto/rand and broadcasts result). */
  const roll_dice= useCallback(
    (notation: string, characterID: string, rollerName: string) => {
      // TODO: send('dice_roll_request', { notation, character_id: characterID, roller_name: rollerName })
      void notation; void characterID; void rollerName; void send
    },
    [send]
  )

  return {
    initiative_order,
    active_turn_index,
    active_combatant: initiative_order[active_turn_index] ?? null,
    set_initiative,
    advance_turn,
    roll_dice,
  }
}
