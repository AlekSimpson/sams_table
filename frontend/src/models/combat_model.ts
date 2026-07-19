// MODEL layer — raw combat/initiative state. Views must not import this directly; use combat_viewmodel instead.
import { create } from 'zustand'
import { DiceRollResultPayload, InitiativeEntry } from '../types/websocket_types'

// Feed keeps the most recent N results only (see DICE_ROLL_HISTORY_LIMIT).
const DICE_ROLL_HISTORY_LIMIT = 10

interface CombatState {
  initiative_order: InitiativeEntry[]
  last_dice_roll_result: DiceRollResultPayload | null
  dice_roll_history: DiceRollResultPayload[]
}

interface CombatActions {
  set_initiative_order: (entries: InitiativeEntry[]) => void
  set_last_dice_roll_result: (result: DiceRollResultPayload) => void
  add_dice_roll_result: (result: DiceRollResultPayload) => void
}

type CombatModel = CombatState & CombatActions

export const combat_model = create<CombatModel>()((set) => ({
  initiative_order: [],
  last_dice_roll_result: null,
  dice_roll_history: [],

  set_initiative_order: (entries) => set({ initiative_order: entries }),
  set_last_dice_roll_result: (result) => set({ last_dice_roll_result: result }),
  add_dice_roll_result: (result) =>
    set((state) => ({
      dice_roll_history: [...state.dice_roll_history, result].slice(-DICE_ROLL_HISTORY_LIMIT),
    })),
}))
