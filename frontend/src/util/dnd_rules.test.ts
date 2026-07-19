import { describe, expect, it } from 'vitest'
import { rules } from './dnd_rules'
import { DNDClass } from '../types/dnd_types'

const WIZARD_CLASS: DNDClass = {
  key: 'wizard',
  name: 'Wizard',
  hit_die: 6,
  saving_throws: ['int', 'wis'],
  primary_ability: ['int'],
  spellcasting_ability: 'int',
  armor_proficiencies: [],
  weapon_proficiencies: ['dagger'],
  num_skill_proficiencies: 2,
}

const FIGHTER_CLASS: DNDClass = {
  key: 'fighter',
  name: 'Fighter',
  hit_die: 10,
  saving_throws: ['str', 'con'],
  primary_ability: ['str', 'dex'],
  armor_proficiencies: ['light', 'medium', 'heavy', 'shields'],
  weapon_proficiencies: ['simple', 'martial'],
  num_skill_proficiencies: 2,
}

describe('dnd_rules', () => {
  describe('calculate_max_hp', () => {
    it('returns 0 when level is less than 1', () => {
      expect(rules.calculate_max_hp(FIGHTER_CLASS, 0, 14)).toBe(0)
    })

    it('computes level 1 HP as hit_die plus the CON modifier', () => {
      // con 14 -> modifier +2; level 1 HP = 8 (wizard hit die 6? use fighter hit_die 10) + 2
      expect(rules.calculate_max_hp(FIGHTER_CLASS, 1, 14)).toBe(12)
    })

    it('applies a negative CON modifier at level 1', () => {
      // con 8 -> modifier -1
      expect(rules.calculate_max_hp(WIZARD_CLASS, 1, 8)).toBe(5)
    })

    it('accumulates per-level HP for levels beyond 1', () => {
      // wizard hit_die 6, con 14 (modifier +2)
      // level 1: 6 + 2 = 8
      // per level (2+): floor(6/2) + 1 + 2 = 3 + 1 + 2 = 6
      // level 3: 8 + 2 * 6 = 20
      expect(rules.calculate_max_hp(WIZARD_CLASS, 3, 14)).toBe(20)
    })
  })

  describe('proficiency_bonus', () => {
    it('is +2 at level 1', () => {
      expect(rules.proficiency_bonus(1)).toBe(2)
    })

    it('is still +2 at level 4 (bonus increases every 4 levels)', () => {
      expect(rules.proficiency_bonus(4)).toBe(2)
    })

    it('increases to +3 at level 5', () => {
      expect(rules.proficiency_bonus(5)).toBe(3)
    })

    it('reaches +6 at level 17', () => {
      expect(rules.proficiency_bonus(17)).toBe(6)
    })

    it('clamps to +2 for a non-positive level', () => {
      expect(rules.proficiency_bonus(0)).toBe(2)
      expect(rules.proficiency_bonus(-5)).toBe(2)
    })
  })
})
