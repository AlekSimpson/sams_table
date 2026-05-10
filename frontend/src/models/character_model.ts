import { DNDCharacter } from '../types/dnd_types'
import { create } from 'zustand'

interface CharacterState {
  characters: Record<string, DNDCharacter>
}

interface CharacterActions {
  set_character: (character: DNDCharacter) => void
  set_characters: (characters: DNDCharacter[]) => void
  remove_character: (character_id: string) => void
  update_hp: (characterID: string, currentHP: number, maxHP: number) => void
  update_conditions: (characterID: string, conditions: string[]) => void
  clear: () => void
}

type CharacterModel = CharacterState & CharacterActions

export const character_model = create<CharacterModel>()((set) => ({
  characters: {},

  set_character: (character) =>
    set((state) => ({
      characters: { ...state.characters, [character.id]: character },
    })),

  set_characters: (characters) =>
    set({
      characters: Object.fromEntries(characters.map((c): [string, DNDCharacter] => [c.id, c])),
    }),

  remove_character: (character_id) =>
    set((state) => {
      const { [character_id]: _, ...rest } = state.characters
      return { characters: rest }
    }),

  update_hp: (character_id, current_hp, max_hp) =>
    set((state) => {
      const char = state.characters[character_id]
      if (!char) return state
      return {
        characters: {
          ...state.characters,
          [character_id]: { ...char, current_hp: current_hp, max_hp: max_hp },
        },
      }
    }),

  update_conditions: (character_id, conditions) =>
    set((state) => {
      const char = state.characters[character_id]
      if (!char) return state
      return {
        characters: {
          ...state.characters,
          [character_id]: { ...char, conditions },
        },
      }
    }),

  clear: () => set({ characters: {} }),
}))
