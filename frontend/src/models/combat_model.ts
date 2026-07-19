// MODEL layer — raw combat/initiative state. Views must not import this directly; use combat_viewmodel instead.
import { create } from 'zustand'
import { InitiativeEntry } from '../types/websocket_types'

interface CombatState {
  initiative_order: InitiativeEntry[]
}

interface CombatActions {
  set_initiative_order: (entries: InitiativeEntry[]) => void
}

type CombatModel = CombatState & CombatActions

export const combat_model = create<CombatModel>()((set) => ({
  initiative_order: [],

  set_initiative_order: (entries) => set({ initiative_order: entries }),
}))
