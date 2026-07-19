// VIEWMODEL layer — combat/initiative/dice logic. The only combat-related import Views need.
import { useCallback, useState } from 'react'
import { InitiativeEntry, InitiativeUpdatePayload } from '../types/websocket_types'
import { DNDCharacter } from '../types/dnd_types'
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

  return {
    initiative_order,
    active_turn_index,
    active_combatant: initiative_order[active_turn_index] ?? null,
    set_initiative,
    advance_turn,
    roll_dice,
    initiative_input_model,
  }
}
