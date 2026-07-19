import { describe, expect, it, beforeEach } from 'vitest'
import { character_model } from './character_model'
import { DNDCharacter } from '../types/dnd_types'

function make_character(overrides: Partial<DNDCharacter> = {}): DNDCharacter {
  return {
    id: 'character-1',
    campaign_id: 'campaign-1',
    name: 'Thorian Ashvale',
    class: 'Fighter',
    race: 'Human',
    level: 5,
    max_hp: 44,
    current_hp: 44,
    armor_class: 17,
    speed: 30,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    skill_profs: [],
    conditions: [],
    equipment: [],
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('character_model', () => {
  beforeEach(() => {
    character_model.getState().clear()
  })

  describe('set_character', () => {
    it('adds a new character keyed by its id', () => {
      const character = make_character()

      character_model.getState().set_character(character)

      expect(character_model.getState().characters).toEqual({ [character.id]: character })
    })

    it('overwrites an existing character with the same id without disturbing others', () => {
      const character_one = make_character({ id: 'character-1', name: 'Thorian' })
      const character_two = make_character({ id: 'character-2', name: 'Lyria' })
      character_model.getState().set_character(character_one)
      character_model.getState().set_character(character_two)

      const updated_character_one = make_character({ id: 'character-1', name: 'Thorian Ashvale II' })
      character_model.getState().set_character(updated_character_one)

      expect(character_model.getState().characters).toEqual({
        'character-1': updated_character_one,
        'character-2': character_two,
      })
    })
  })

  describe('set_characters', () => {
    it('replaces the entire character map, keyed by id', () => {
      character_model.getState().set_character(make_character({ id: 'stale-character' }))

      const character_one = make_character({ id: 'character-1' })
      const character_two = make_character({ id: 'character-2' })
      character_model.getState().set_characters([character_one, character_two])

      expect(character_model.getState().characters).toEqual({
        'character-1': character_one,
        'character-2': character_two,
      })
    })

    it('resets to an empty map when given an empty array', () => {
      character_model.getState().set_character(make_character())

      character_model.getState().set_characters([])

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('remove_character', () => {
    it('removes the character with the given id', () => {
      const character = make_character({ id: 'character-1' })
      character_model.getState().set_character(character)

      character_model.getState().remove_character('character-1')

      expect(character_model.getState().characters).toEqual({})
    })

    it('is a no-op when the id does not exist', () => {
      const character = make_character({ id: 'character-1' })
      character_model.getState().set_character(character)

      character_model.getState().remove_character('nonexistent-id')

      expect(character_model.getState().characters).toEqual({ 'character-1': character })
    })
  })

  describe('update_hp', () => {
    it('updates current_hp and max_hp for an existing character', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', current_hp: 44, max_hp: 44 }))

      character_model.getState().update_hp('character-1', 10, 44)

      expect(character_model.getState().characters['character-1']).toMatchObject({ current_hp: 10, max_hp: 44 })
    })

    it('allows current_hp to be set to 0 (downed character)', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', current_hp: 44, max_hp: 44 }))

      character_model.getState().update_hp('character-1', 0, 44)

      expect(character_model.getState().characters['character-1'].current_hp).toBe(0)
    })

    it('is a no-op when the character id does not exist', () => {
      character_model.getState().update_hp('nonexistent-id', 10, 44)

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('update_conditions', () => {
    it('replaces the conditions list for an existing character', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', conditions: [] }))

      character_model.getState().update_conditions('character-1', ['poisoned', 'prone'])

      expect(character_model.getState().characters['character-1'].conditions).toEqual(['poisoned', 'prone'])
    })

    it('allows clearing conditions with an empty array', () => {
      character_model.getState().set_character(make_character({ id: 'character-1', conditions: ['poisoned'] }))

      character_model.getState().update_conditions('character-1', [])

      expect(character_model.getState().characters['character-1'].conditions).toEqual([])
    })

    it('is a no-op when the character id does not exist', () => {
      character_model.getState().update_conditions('nonexistent-id', ['poisoned'])

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('clear', () => {
    it('resets the character map to empty', () => {
      character_model.getState().set_character(make_character())

      character_model.getState().clear()

      expect(character_model.getState().characters).toEqual({})
    })
  })
})
