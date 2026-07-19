// MODEL layer — raw combat/initiative state. Views must not import this directly; use combat_viewmodel instead.
import { create } from 'zustand'
import { DiceRollResultPayload, InitiativeEntry } from '../types/websocket_types'

interface CombatState {
  initiative_order: InitiativeEntry[]
  last_dice_roll_result: DiceRollResultPayload | null
}

interface CombatActions {
  set_initiative_order: (entries: InitiativeEntry[]) => void
  set_last_dice_roll_result: (result: DiceRollResultPayload) => void
}

type CombatModel = CombatState & CombatActions

export const combat_model = create<CombatModel>()((set) => ({
  initiative_order: [],
  last_dice_roll_result: null,

  set_initiative_order: (entries) => set({ initiative_order: entries }),
  set_last_dice_roll_result: (result) => set({ last_dice_roll_result: result }),
}))
