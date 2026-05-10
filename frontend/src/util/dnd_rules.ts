import { DNDClass } from "../types/dnd_types"

// D&D 5e utility functions.
export const rules = {
  calculate_max_hp: (dnd_class: DNDClass, level: number, constitution_score: number): number => {
  // PHB average method: level 1 = max die, subsequent levels = floor(die/2)+1
  // Both values add CON modifier per level.
    if (level < 1) return 0
    const con_mod    = Math.floor((constitution_score - 10) / 2)
    const level_1_hp = dnd_class.hit_die + con_mod
    const per_level  = Math.floor(dnd_class.hit_die / 2) + 1 + con_mod
    return level_1_hp + (level - 1) * per_level
  },
  proficiency_bonus: (level: number): number => {
    return 2 + Math.floor(Math.max(0, level - 1) / 4)
  }
}

