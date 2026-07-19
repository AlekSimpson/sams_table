import { describe, expect, it, beforeEach } from 'vitest'
import { combat_model } from './combat_model'
import { DiceRollResultPayload, InitiativeEntry } from '../types/websocket_types'

function make_initiative_entry(overrides: Partial<InitiativeEntry> = {}): InitiativeEntry {
  return {
    character_id: 'character-1',
    name: 'Thorian Ashvale',
    initiative: 15,
    is_npc: false,
    ...overrides,
  }
}

function make_dice_roll_result(overrides: Partial<DiceRollResultPayload> = {}): DiceRollResultPayload {
  return {
    roller_id: 'character-1',
    roller_name: 'Thorian Ashvale',
    dice: '1d20',
    results: [12],
    total: 12,
    ...overrides,
  }
}

const INITIAL_STATE = {
  initiative_order: [],
  last_dice_roll_result: null,
  dice_roll_history: [],
}

describe('combat_model', () => {
  beforeEach(() => {
    combat_model.setState(INITIAL_STATE)
  })

  describe('set_initiative_order', () => {
    it('sets the initiative order', () => {
      const entries = [make_initiative_entry({ character_id: 'character-1', initiative: 18 }), make_initiative_entry({ character_id: 'character-2', initiative: 9 })]

      combat_model.getState().set_initiative_order(entries)

      expect(combat_model.getState().initiative_order).toEqual(entries)
    })

    it('replaces a previous initiative order with an empty list', () => {
      combat_model.getState().set_initiative_order([make_initiative_entry()])

      combat_model.getState().set_initiative_order([])

      expect(combat_model.getState().initiative_order).toEqual([])
    })
  })

  describe('set_last_dice_roll_result', () => {
    it('sets the last dice roll result', () => {
      const result = make_dice_roll_result()

      combat_model.getState().set_last_dice_roll_result(result)

      expect(combat_model.getState().last_dice_roll_result).toEqual(result)
    })

    it('does not add the result to dice_roll_history', () => {
      combat_model.getState().set_last_dice_roll_result(make_dice_roll_result())

      expect(combat_model.getState().dice_roll_history).toEqual([])
    })
  })

  describe('add_dice_roll_result', () => {
    it('appends the result to dice_roll_history', () => {
      const result = make_dice_roll_result()

      combat_model.getState().add_dice_roll_result(result)

      expect(combat_model.getState().dice_roll_history).toEqual([result])
    })

    it('does not set last_dice_roll_result', () => {
      combat_model.getState().add_dice_roll_result(make_dice_roll_result())

      expect(combat_model.getState().last_dice_roll_result).toBeNull()
    })

    it('caps the history at the most recent 10 results, dropping the oldest first', () => {
      const results = Array.from({ length: 11 }, (_, index) => make_dice_roll_result({ total: index }))

      for (const result of results) {
        combat_model.getState().add_dice_roll_result(result)
      }

      const history = combat_model.getState().dice_roll_history
      expect(history).toHaveLength(10)
      expect(history.map((result) => result.total)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
  })
})
