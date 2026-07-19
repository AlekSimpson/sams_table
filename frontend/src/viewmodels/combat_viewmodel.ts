// VIEWMODEL layer — combat/initiative/dice logic. The only combat-related import Views need.
import { useCallback, useEffect, useState } from 'react'
import { DiceRollRequestPayload, DiceRollResultPayload, InitiativeEntry, InitiativeUpdatePayload } from '../types/websocket_types'
import { DNDCharacter } from '../types/dnd_types'
import { combat_model } from '../models/combat_model'
import { websocket_hook } from '../util/websockets'

// Standard dice notation: NdM optionally followed by +K or -K, e.g. "2d6+3", "1d20", "4d8-2".
const DICE_NOTATION_PATTERN = /^\d+d\d+([+-]\d+)?$/i

export function is_valid_dice_notation(notation: string): boolean {
  return DICE_NOTATION_PATTERN.test(notation.trim())
}

export function combat_viewmodel() {
  const { initiative_order, last_dice_roll_result } = combat_model()
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
  const roll_dice = useCallback(
    (notation: string, character_id: string, roller_name: string) => {
      send<DiceRollRequestPayload>('dice_roll_request', { notation, character_id, roller_name })
    },
    [send]
  )

  /** DM: local draft state for the initiative-setting form — per-character values plus
   *  standalone NPC entries — submitted together via set_initiative. */
  function initiative_input_model() {
    const [character_initiative_drafts, set_character_initiative_drafts] = useState<Record<string, string>>({})
    const [npc_name_draft, set_npc_name_draft] = useState('')
    const [npc_initiative_draft, set_npc_initiative_draft] = useState('')
    const [npc_entries, set_npc_entries] = useState<InitiativeEntry[]>([])

    const on_character_initiative_change = (character_id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      set_character_initiative_drafts((drafts) => ({ ...drafts, [character_id]: value }))
    }

    const on_npc_name_change = (event: React.ChangeEvent<HTMLInputElement>) => set_npc_name_draft(event.target.value)
    const on_npc_initiative_change = (event: React.ChangeEvent<HTMLInputElement>) => set_npc_initiative_draft(event.target.value)

    const on_add_npc_entry = () => {
      const initiative_value = parseInt(npc_initiative_draft, 10)
      if (!npc_name_draft.trim() || Number.isNaN(initiative_value)) return
      set_npc_entries((entries) => [
        ...entries,
        { character_id: crypto.randomUUID(), name: npc_name_draft.trim(), initiative: initiative_value, is_npc: true },
      ])
      set_npc_name_draft('')
      set_npc_initiative_draft('')
    }

    const on_remove_npc_entry = (character_id: string) => {
      set_npc_entries((entries) => entries.filter((entry) => entry.character_id !== character_id))
    }

    /** Builds entries from characters with a drafted value plus any added NPCs, then broadcasts them. */
    const on_submit = (characters: DNDCharacter[]) => {
      const character_entries: InitiativeEntry[] = characters
        .filter((character) => character_initiative_drafts[character.id]?.trim())
        .map((character) => ({
          character_id: character.id,
          name: character.name,
          initiative: parseInt(character_initiative_drafts[character.id], 10),
          is_npc: false,
        }))
        .filter((entry) => !Number.isNaN(entry.initiative))

      set_initiative([...character_entries, ...npc_entries])
    }

    return {
      character_initiative_drafts,
      on_character_initiative_change,
      npc_name_draft,
      npc_initiative_draft,
      on_npc_name_change,
      on_npc_initiative_change,
      npc_entries,
      on_add_npc_entry,
      on_remove_npc_entry,
      on_submit,
    }
  }

  /** Player: dice roller form state — notation draft, client-side validation, and the
   *  "waiting for result" flag, which clears once the matching `dice_roll_result` for
   *  this roll's character round-trips back over the WS connection. */
  function dice_roller_model() {
    const [notation_draft, set_notation_draft] = useState('')
    const [validation_error, set_validation_error] = useState<string | null>(null)
    const [is_rolling, set_is_rolling] = useState(false)
    const [rolling_character_id, set_rolling_character_id] = useState<string | null>(null)
    const [last_result, set_last_result] = useState<DiceRollResultPayload | null>(null)

    const on_notation_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_notation_draft(event.target.value)
      if (validation_error) set_validation_error(null)
    }

    const on_roll_press = (character_id: string, roller_name: string) => {
      const trimmed_notation = notation_draft.trim()
      if (!is_valid_dice_notation(trimmed_notation)) {
        set_validation_error('Enter valid dice notation, e.g. 2d6+3 or 1d20')
        return
      }
      set_validation_error(null)
      set_is_rolling(true)
      set_rolling_character_id(character_id)
      roll_dice(trimmed_notation, character_id, roller_name)
    }

    useEffect(() => {
      if (!last_dice_roll_result || !rolling_character_id) return
      if (last_dice_roll_result.roller_id !== rolling_character_id) return
      set_is_rolling(false)
      set_last_result(last_dice_roll_result)
    }, [last_dice_roll_result, rolling_character_id])

    return {
      notation_draft,
      on_notation_change,
      validation_error,
      is_rolling,
      on_roll_press,
      last_result,
    }
  }

  return {
    initiative_order,
    active_turn_index,
    active_combatant: initiative_order[active_turn_index] ?? null,
    set_initiative,
    advance_turn,
    roll_dice,
    initiative_input_model,
    dice_roller_model,
  }
}
