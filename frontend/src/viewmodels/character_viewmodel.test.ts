import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { character_model } from '../models/character_model'
import { DNDCharacter } from '../types/dnd_types'

// character_api is mocked at the module level (rather than letting calls fall through
// to the mock backend) so every test controls success/failure directly and none of them
// pay for the mock backend's simulated network latency.
const { mock_character_api, mock_navigate } = vi.hoisted(() => ({
  mock_character_api: {
    list_characters_in_campaign: vi.fn<(campaign_id: string) => Promise<DNDCharacter[]>>(),
    list_user_characters: vi.fn<(user_id: string) => Promise<DNDCharacter[]>>(),
    create: vi.fn<(user_id: string, data: { name: string; class?: string; race?: string }) => Promise<DNDCharacter>>(),
    get: vi.fn<(id: string) => Promise<DNDCharacter>>(),
    update: vi.fn<(id: string, data: Partial<DNDCharacter>) => Promise<DNDCharacter>>(),
    delete: vi.fn<(id: string) => Promise<void>>(),
  },
  mock_navigate: vi.fn(),
}))

vi.mock('../util/rest_client', () => ({
  character_api: mock_character_api,
}))

vi.mock('react-router-dom', async (import_original) => {
  const actual = await import_original<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mock_navigate }
})

import { character_viewmodel } from './character_viewmodel'

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

// Mirrors how views/character_sheet.tsx consumes the viewmodel: look up the character
// fresh from the store on every render and hand it to character_sheet_model. Because
// character_viewmodel() subscribes to the whole character_model store, any set_character
// call automatically re-renders this hook with the latest character.
function render_character_sheet(character_id: string) {
  return renderHook(() => {
    const view_model = character_viewmodel()
    return view_model.character_sheet_model(view_model.characters[character_id])
  })
}

function render_character_card(character: DNDCharacter) {
  return renderHook(() => character_viewmodel().character_card_model(character))
}

beforeEach(() => {
  character_model.getState().clear()
  vi.resetAllMocks()
})

// This project's vitest.config.ts does not set `test.globals: true`, so
// @testing-library/react's automatic afterEach cleanup (which depends on a
// global `afterEach`) never registers. Without an explicit unmount here, a
// hook rendered by one test stays mounted and subscribed to character_model,
// and throws when a later test clears/mutates the store out from under it.
afterEach(() => {
  cleanup()
})

describe('character_sheet_model', () => {
  describe('ability and skill math', () => {
    it('computes ability modifiers using the floor((score-10)/2) formula', () => {
      const character = make_character()
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.ability_modifier(16)).toBe(3)
      expect(result.current.ability_modifier(10)).toBe(0)
      expect(result.current.ability_modifier(8)).toBe(-1)
      expect(result.current.ability_modifier(9)).toBe(-1)
    })

    it('formats modifiers with an explicit + sign for zero and positive values', () => {
      const character = make_character()
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.format_modifier(10)).toBe('+0')
      expect(result.current.format_modifier(16)).toBe('+3')
      expect(result.current.format_modifier(8)).toBe('-1')
    })

    it('computes the proficiency bonus from level using the 5e breakpoints', () => {
      const character = make_character()
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.proficiency_bonus(1)).toBe(2)
      expect(result.current.proficiency_bonus(4)).toBe(2)
      expect(result.current.proficiency_bonus(5)).toBe(3)
      expect(result.current.proficiency_bonus(9)).toBe(4)
      expect(result.current.proficiency_bonus(13)).toBe(5)
      expect(result.current.proficiency_bonus(17)).toBe(6)
      expect(result.current.proficiency_bonus(20)).toBe(6)
    })

    it('reports proficiency for a skill listed in skill_profs', () => {
      const character = make_character({ skill_profs: ['stealth'] })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.is_skill_proficient('stealth')).toBe(true)
    })

    it('reports non-proficiency for a skill not listed in skill_profs', () => {
      const character = make_character({ skill_profs: ['stealth'] })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.is_skill_proficient('athletics')).toBe(false)
    })

    it('adds the proficiency bonus to the skill modifier only when the skill is proficient', () => {
      const character = make_character({
        level: 5, // proficiency bonus +3
        stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, // dex modifier +2, str modifier +3
        skill_profs: ['stealth'], // stealth is dex-based
      })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)
      const stealth_skill = result.current.SKILLS.find((skill) => skill.key === 'stealth')!
      const athletics_skill = result.current.SKILLS.find((skill) => skill.key === 'athletics')!

      expect(result.current.format_skill_modifier(stealth_skill)).toBe('+5')
      expect(result.current.format_skill_modifier(athletics_skill)).toBe('+3')
    })
  })

  describe('health_percentage and hp_bar_class', () => {
    it('computes health percentage as a ratio of current to max hp', () => {
      const character = make_character({ current_hp: 22, max_hp: 44 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.health_percentage).toBe(50)
    })

    it('returns 0 health percentage when max_hp is 0', () => {
      const character = make_character({ current_hp: 0, max_hp: 0 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.health_percentage).toBe(0)
    })

    it('applies the critical class below 25% health', () => {
      const character = make_character({ current_hp: 10, max_hp: 44 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.hp_bar_class).toBe(' cs__hp-bar-fill--critical')
    })

    it('applies the low class between 25% and 50% health', () => {
      const character = make_character({ current_hp: 15, max_hp: 44 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.hp_bar_class).toBe(' cs__hp-bar-fill--low')
    })

    it('applies no extra class at or above 50% health', () => {
      const character = make_character({ current_hp: 30, max_hp: 44 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      expect(result.current.hp_bar_class).toBe('')
    })
  })

  describe('current HP editing', () => {
    it('optimistically updates current_hp on every keystroke without calling the API', () => {
      const character = make_character({ current_hp: 44, max_hp: 44 })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_current_hp_change({ target: { value: '10' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(character_model.getState().characters[character.id].current_hp).toBe(10)
      expect(mock_character_api.update).not.toHaveBeenCalled()
    })

    it('commits the new current_hp on blur and replaces the character with the server response on success', async () => {
      const character = make_character({ current_hp: 44, max_hp: 44 })
      character_model.getState().set_character(character)
      const server_updated_character = make_character({ current_hp: 10, max_hp: 44, notes: 'server touched it' })
      mock_character_api.update.mockResolvedValue(server_updated_character)
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_current_hp_focus()
        result.current.on_current_hp_change({ target: { value: '10' } } as React.ChangeEvent<HTMLInputElement>)
      })
      act(() => {
        result.current.on_current_hp_blur()
      })

      expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { current_hp: 10 })
      await waitFor(() => expect(character_model.getState().characters[character.id]).toEqual(server_updated_character))
    })

    it('rolls back to the pre-edit current_hp when the save fails', async () => {
      const character = make_character({ current_hp: 44, max_hp: 44 })
      character_model.getState().set_character(character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_current_hp_focus()
        result.current.on_current_hp_change({ target: { value: '10' } } as React.ChangeEvent<HTMLInputElement>)
      })
      act(() => {
        result.current.on_current_hp_blur()
      })

      await waitFor(() => expect(character_model.getState().characters[character.id].current_hp).toBe(44))
    })

    it('steps current_hp up, clamped at max_hp, and commits immediately without a blur event', async () => {
      const character = make_character({ current_hp: 40, max_hp: 44 })
      character_model.getState().set_character(character)
      mock_character_api.update.mockResolvedValue(make_character({ current_hp: 44, max_hp: 44 }))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_current_hp_step(10)()
      })

      expect(character_model.getState().characters[character.id].current_hp).toBe(44)
      await waitFor(() => expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { current_hp: 44 }))
    })

    it('steps current_hp down, clamped at 0, and rolls back on save failure', async () => {
      const character = make_character({ current_hp: 5, max_hp: 44 })
      character_model.getState().set_character(character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_current_hp_step(-10)()
      })

      expect(character_model.getState().characters[character.id].current_hp).toBe(0)
      expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { current_hp: 0 })
      await waitFor(() => expect(character_model.getState().characters[character.id].current_hp).toBe(5))
    })
  })

  describe('notes debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('commits once, 500ms after the last keystroke, not once per keystroke', async () => {
      const character = make_character({ notes: 'original notes' })
      character_model.getState().set_character(character)
      mock_character_api.update.mockResolvedValue(make_character({ notes: 'original notesabc' }))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_notes_change({ target: { value: 'original notesa' } } as React.ChangeEvent<HTMLTextAreaElement>)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      act(() => {
        result.current.on_notes_change({ target: { value: 'original notesab' } } as React.ChangeEvent<HTMLTextAreaElement>)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      act(() => {
        result.current.on_notes_change({ target: { value: 'original notesabc' } } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(mock_character_api.update).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(mock_character_api.update).toHaveBeenCalledTimes(1)
      expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { notes: 'original notesabc' })
    })

    it('rolls back to the value from the start of the edit session, not the value when the debounced call fired, on failure', async () => {
      const character = make_character({ notes: 'original notes' })
      character_model.getState().set_character(character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_notes_change({ target: { value: 'original notesa' } } as React.ChangeEvent<HTMLTextAreaElement>)
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      act(() => {
        result.current.on_notes_change({ target: { value: 'original notesab' } } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })

      expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { notes: 'original notesab' })
      expect(character_model.getState().characters[character.id].notes).toBe('original notes')
    })
  })

  describe('equipment', () => {
    it('does nothing when adding a blank (whitespace-only) item name', () => {
      const character = make_character({ equipment: ['Longsword'] })
      character_model.getState().set_character(character)
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_equipment_add('   ')
      })

      expect(character_model.getState().characters[character.id].equipment).toEqual(['Longsword'])
      expect(mock_character_api.update).not.toHaveBeenCalled()
    })

    it('optimistically adds a trimmed item and replaces with the server response on success', async () => {
      const character = make_character({ equipment: ['Longsword'] })
      character_model.getState().set_character(character)
      const server_updated_character = make_character({ equipment: ['Longsword', 'Shield'] })
      mock_character_api.update.mockResolvedValue(server_updated_character)
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_equipment_add('  Shield  ')
      })

      expect(character_model.getState().characters[character.id].equipment).toEqual(['Longsword', 'Shield'])
      expect(mock_character_api.update).toHaveBeenCalledWith(character.id, { equipment: ['Longsword', 'Shield'] })
      await waitFor(() => expect(character_model.getState().characters[character.id]).toEqual(server_updated_character))
    })

    it('rolls back to the previous equipment list when adding fails', async () => {
      const character = make_character({ equipment: ['Longsword'] })
      character_model.getState().set_character(character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_equipment_add('Shield')
      })

      await waitFor(() => expect(character_model.getState().characters[character.id].equipment).toEqual(['Longsword']))
    })

    it('optimistically removes an item by index and replaces with the server response on success', async () => {
      const character = make_character({ equipment: ['Longsword', 'Shield'] })
      character_model.getState().set_character(character)
      const server_updated_character = make_character({ equipment: ['Longsword'] })
      mock_character_api.update.mockResolvedValue(server_updated_character)
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_equipment_remove(1)
      })

      expect(character_model.getState().characters[character.id].equipment).toEqual(['Longsword'])
      await waitFor(() => expect(character_model.getState().characters[character.id]).toEqual(server_updated_character))
    })

    it('rolls back to the previous equipment list when removing fails', async () => {
      const character = make_character({ equipment: ['Longsword', 'Shield'] })
      character_model.getState().set_character(character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = render_character_sheet(character.id)

      act(() => {
        result.current.on_equipment_remove(0)
      })

      await waitFor(() =>
        expect(character_model.getState().characters[character.id].equipment).toEqual(['Longsword', 'Shield'])
      )
    })
  })
})

describe('character_card_model', () => {
  it('computes health_percentage as a ratio of current to max hp', () => {
    const character = make_character({ current_hp: 22, max_hp: 44 })
    const { result } = render_character_card(character)

    expect(result.current.health_percentage).toBe(50)
  })

  it('returns 0 health_percentage when max_hp is 0', () => {
    const character = make_character({ current_hp: 0, max_hp: 0 })
    const { result } = render_character_card(character)

    expect(result.current.health_percentage).toBe(0)
  })

  it('flags is_low_health below the 30% threshold', () => {
    const character = make_character({ current_hp: 10, max_hp: 44 }) // ~22.7%
    const { result } = render_character_card(character)

    expect(result.current.is_low_health).toBe(true)
  })

  it('does not flag is_low_health at or above the 30% threshold', () => {
    const character = make_character({ current_hp: 20, max_hp: 44 }) // ~45.5%
    const { result } = render_character_card(character)

    expect(result.current.is_low_health).toBe(false)
  })

  it('navigates to the character dashboard on card click', () => {
    const character = make_character({ id: 'character-1' })
    const { result } = render_character_card(character)

    result.current.on_card_click()

    expect(mock_navigate).toHaveBeenCalledWith('/play/dashboard/character-1')
  })

  describe('on_delete_click', () => {
    it('stops propagation and deletes the character when the confirm dialog is accepted', async () => {
      const character = make_character()
      character_model.getState().set_character(character)
      mock_character_api.delete.mockResolvedValue(undefined)
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const { result } = render_character_card(character)
      const stop_propagation = vi.fn()

      await act(async () => {
        result.current.on_delete_click({ stopPropagation: stop_propagation } as unknown as React.MouseEvent)
      })

      expect(stop_propagation).toHaveBeenCalled()
      await waitFor(() => expect(character_model.getState().characters).toEqual({}))
    })

    it('does not delete the character when the confirm dialog is dismissed', () => {
      const character = make_character()
      character_model.getState().set_character(character)
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const { result } = render_character_card(character)

      act(() => {
        result.current.on_delete_click({ stopPropagation: vi.fn() } as unknown as React.MouseEvent)
      })

      expect(mock_character_api.delete).not.toHaveBeenCalled()
      expect(character_model.getState().characters).toEqual({ [character.id]: character })
    })
  })
})

describe('loading and mutating characters', () => {
  describe('load_user_characters', () => {
    it('populates the store with the characters returned by the API on success', async () => {
      const characters = [make_character({ id: 'character-1' }), make_character({ id: 'character-2' })]
      mock_character_api.list_user_characters.mockResolvedValue(characters)
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.load_user_characters('user-1')
      })

      expect(mock_character_api.list_user_characters).toHaveBeenCalledWith('user-1')
      expect(character_model.getState().characters).toEqual({
        'character-1': characters[0],
        'character-2': characters[1],
      })
    })

    it('leaves the store untouched when the API call fails', async () => {
      mock_character_api.list_user_characters.mockRejectedValue(new Error('network error'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.load_user_characters('user-1')
        })
      ).rejects.toThrow('network error')

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('load_character', () => {
    it('adds the character returned by the API to the store on success', async () => {
      const character = make_character()
      mock_character_api.get.mockResolvedValue(character)
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.load_character(character.id)
      })

      expect(mock_character_api.get).toHaveBeenCalledWith(character.id)
      expect(character_model.getState().characters[character.id]).toEqual(character)
    })

    it('leaves the store untouched when the API call fails', async () => {
      mock_character_api.get.mockRejectedValue(new Error('not found'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.load_character('missing-character-id')
        })
      ).rejects.toThrow('not found')

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('load_campaign_characters', () => {
    it('replaces the store with the characters returned by the API on success', async () => {
      const characters = [make_character({ id: 'character-1' }), make_character({ id: 'character-2' })]
      mock_character_api.list_characters_in_campaign.mockResolvedValue(characters)
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.load_campaign_characters('campaign-1')
      })

      expect(mock_character_api.list_characters_in_campaign).toHaveBeenCalledWith('campaign-1')
      expect(character_model.getState().characters).toEqual({
        'character-1': characters[0],
        'character-2': characters[1],
      })
    })

    it('leaves the store untouched when the API call fails', async () => {
      mock_character_api.list_characters_in_campaign.mockRejectedValue(new Error('network error'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.load_campaign_characters('campaign-1')
        })
      ).rejects.toThrow('network error')

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('create_new_character_for_user', () => {
    it('adds the newly created character to the store on success', async () => {
      const new_character = make_character({ id: 'new-character-id', name: 'Freshly Rolled' })
      mock_character_api.create.mockResolvedValue(new_character)
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.create_new_character_for_user('user-1', 'Freshly Rolled')
      })

      expect(mock_character_api.create).toHaveBeenCalledWith('user-1', { name: 'Freshly Rolled' })
      expect(character_model.getState().characters['new-character-id']).toEqual(new_character)
    })

    it('leaves the store untouched when the API call fails', async () => {
      mock_character_api.create.mockRejectedValue(new Error('creation failed'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.create_new_character_for_user('user-1', 'Freshly Rolled')
        })
      ).rejects.toThrow('creation failed')

      expect(character_model.getState().characters).toEqual({})
    })
  })

  describe('delete_character', () => {
    it('removes the character from the store on success', async () => {
      const character = make_character()
      character_model.getState().set_character(character)
      mock_character_api.delete.mockResolvedValue(undefined)
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.delete_character(character.id)
      })

      expect(mock_character_api.delete).toHaveBeenCalledWith(character.id)
      expect(character_model.getState().characters).toEqual({})
    })

    it('leaves the character in the store when the API call fails', async () => {
      const character = make_character()
      character_model.getState().set_character(character)
      mock_character_api.delete.mockRejectedValue(new Error('delete failed'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.delete_character(character.id)
        })
      ).rejects.toThrow('delete failed')

      expect(character_model.getState().characters).toEqual({ [character.id]: character })
    })
  })

  describe('update_character', () => {
    it('is a no-op and never calls the API when the character is not in the store', async () => {
      const { result } = renderHook(() => character_viewmodel())

      await act(async () => {
        await result.current.update_character('missing-character-id', { name: 'Someone Else' })
      })

      expect(mock_character_api.update).not.toHaveBeenCalled()
    })

    it('optimistically applies the patch immediately, then replaces it with the server response once the API call resolves', async () => {
      const original_character = make_character({ name: 'Thorian' })
      character_model.getState().set_character(original_character)
      let resolve_update!: (character: DNDCharacter) => void
      mock_character_api.update.mockImplementation(
        () => new Promise<DNDCharacter>((resolve) => { resolve_update = resolve })
      )
      const { result } = renderHook(() => character_viewmodel())

      let update_promise!: Promise<void>
      act(() => {
        update_promise = result.current.update_character(original_character.id, { name: 'Thorian the Bold' })
      })

      // Optimistic update is visible immediately, before the API call has resolved.
      expect(character_model.getState().characters[original_character.id].name).toBe('Thorian the Bold')

      const server_updated_character = make_character({ name: 'Thorian the Bold (confirmed)' })
      await act(async () => {
        resolve_update(server_updated_character)
        await update_promise
      })

      expect(character_model.getState().characters[original_character.id]).toEqual(server_updated_character)
    })

    it('leaves the optimistic patch applied and rejects when the API call fails', async () => {
      const original_character = make_character({ name: 'Thorian' })
      character_model.getState().set_character(original_character)
      mock_character_api.update.mockRejectedValue(new Error('save failed'))
      const { result } = renderHook(() => character_viewmodel())

      await expect(
        act(async () => {
          await result.current.update_character(original_character.id, { name: 'Thorian the Bold' })
        })
      ).rejects.toThrow('save failed')

      expect(character_model.getState().characters[original_character.id].name).toBe('Thorian the Bold')
    })
  })
})
