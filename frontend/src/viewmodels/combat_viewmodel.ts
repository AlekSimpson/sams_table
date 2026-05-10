// VIEWMODEL layer — combat/initiative/dice logic. The only combat-related import Views need.
import { useCallback, useState } from 'react'
import { InitiativeEntry } from '../types/websocket_types'
import { websocket_hook } from '../util/websockets'

export function combat_viewmodel() {
  const [initiative_order, set_initiative_order] = useState<InitiativeEntry[]>([])
  const [active_turn_index, set_active_turn_index] = useState(0)
  const { send } = websocket_hook()

  /** DM: set and broadcast the initiative order. Sorts by roll descending. */
  const set_initiative = useCallback(
    (entries: InitiativeEntry[]) => {
      const sorted = [...entries].sort((a, b) => b.initiative - a.initiative)
      set_initiative_order(sorted)
      // TODO: send('initiative_update', { ordered_entries: sorted })
      void send
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
