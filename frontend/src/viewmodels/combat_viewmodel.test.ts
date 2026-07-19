import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { combat_model } from '../models/combat_model'
import { character_model } from '../models/character_model'
import { DNDCharacter } from '../types/dnd_types'
import { DiceRollResultPayload } from '../types/websocket_types'

// character_api is mocked at the module level (rather than letting calls fall through to
// the mock backend) so every test controls success/failure directly, following the pattern
// in character_viewmodel.test.ts. websocket_hook is mocked so tests can assert on outgoing
// `send` calls without a real WebSocket connection, following map_viewmodel.test.ts.
const { mock_character_api, mock_send } = vi.hoisted(() => ({
  mock_character_api: {
    update: vi.fn<(id: string, data: Partial<DNDCharacter>) => Promise<DNDCharacter>>(),
  },
  mock_send: vi.fn(),
}))

vi.mock('../util/rest_client', () => ({
  character_api: mock_character_api,
}))

vi.mock('../util/websockets', () => ({
  websocket_hook: () => ({ send: mock_send }),
}))

import { combat_viewmodel, is_valid_dice_notation } from './combat_viewmodel'

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

const COMBAT_INITIAL_STATE = {
  initiative_order: [],
  last_dice_roll_result: null,
  dice_roll_history: [],
}

function render_combat_viewmodel() {
  return renderHook(() => combat_viewmodel())
}

function render_initiative_input() {
  return renderHook(() => combat_viewmodel().initiative_input_model())
}

function render_dice_roller() {
  return renderHook(() => combat_viewmodel().dice_roller_model())
}

beforeEach(() => {
  combat_model.setState(COMBAT_INITIAL_STATE)
  character_model.getState().clear()
  vi.resetAllMocks()
})

// This project's vitest.config.ts does not set `test.globals: true`, so
// @testing-library/react's automatic afterEach cleanup (which depends on a global
// `afterEach`) never registers. Without an explicit unmount here, a hook rendered by one
// test stays mounted and subscribed to combat_model/character_model, and throws when a
// later test resets/mutates the store out from under it.
afterEach(() => {
  cleanup()
})

describe('is_valid_dice_notation', () => {
  it.each(['2d6+3', '1d20', '4d8-2', '10d4'])('accepts the valid notation %s', (notation) => {
    expect(is_valid_dice_notation(notation)).toBe(true)
  })

  it.each(['d20', '2d', '2x6', '', '2d6++3'])('rejects the invalid notation %s', (notation) => {
    expect(is_valid_dice_notation(notation)).toBe(false)
  })
})

describe('initiative_input_model', () => {
  it('builds a sorted list of character and NPC entries and broadcasts it on submit', () => {
    const characters = [
      make_character({ id: 'character-1', name: 'Aria' }),
      make_character({ id: 'character-2', name: 'Boren' }),
    ]
    const { result } = render_initiative_input()

    act(() => {
      result.current.on_character_initiative_change('character-1')({
        target: { value: '10' },
      } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_character_initiative_change('character-2')({
        target: { value: '20' },
      } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_npc_name_change({ target: { value: 'Goblin' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_npc_initiative_change({ target: { value: '15' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_add_npc_entry()
    })
    const npc_entry = result.current.npc_entries[0]

    act(() => {
      result.current.on_submit(characters)
    })

    expect(mock_send).toHaveBeenCalledWith('initiative_update', {
      ordered_entries: [
        { character_id: 'character-2', name: 'Boren', initiative: 20, is_npc: false },
        npc_entry,
        { character_id: 'character-1', name: 'Aria', initiative: 10, is_npc: false },
      ],
    })
  })

  it('broadcasts an empty ordered_entries list when submitting with no drafts and no NPC entries', () => {
    const { result } = render_initiative_input()

    act(() => {
      result.current.on_submit([])
    })

    expect(mock_send).toHaveBeenCalledWith('initiative_update', { ordered_entries: [] })
  })
})

describe('update_character_hp', () => {
  it('optimistically applies the clamped HP, persists via REST, and broadcasts hp_update on success', async () => {
    const character = make_character({ id: 'character-1', current_hp: 20, max_hp: 40 })
    character_model.getState().set_character(character)
    const server_updated = make_character({ id: 'character-1', current_hp: 15, max_hp: 40 })
    mock_character_api.update.mockResolvedValue(server_updated)
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.update_character_hp('character-1', 15)
    })

    expect(mock_character_api.update).toHaveBeenCalledWith('character-1', { ...character, current_hp: 15 })
    expect(character_model.getState().characters['character-1']).toEqual(server_updated)
    expect(mock_send).toHaveBeenCalledWith('hp_update', { character_id: 'character-1', current_hp: 15, max_hp: 40 })
  })

  it('clamps the new HP at max_hp when the requested value overshoots', async () => {
    const character = make_character({ id: 'character-1', current_hp: 20, max_hp: 40 })
    character_model.getState().set_character(character)
    mock_character_api.update.mockResolvedValue(make_character({ id: 'character-1', current_hp: 40, max_hp: 40 }))
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.update_character_hp('character-1', 999)
    })

    expect(mock_character_api.update).toHaveBeenCalledWith('character-1', { ...character, current_hp: 40 })
  })

  it('clamps the new HP at 0 when the requested value is negative', async () => {
    const character = make_character({ id: 'character-1', current_hp: 20, max_hp: 40 })
    character_model.getState().set_character(character)
    mock_character_api.update.mockResolvedValue(make_character({ id: 'character-1', current_hp: 0, max_hp: 40 }))
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.update_character_hp('character-1', -50)
    })

    expect(mock_character_api.update).toHaveBeenCalledWith('character-1', { ...character, current_hp: 0 })
  })

  it('is a no-op when the new HP is NaN', async () => {
    const character = make_character({ id: 'character-1' })
    character_model.getState().set_character(character)
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.update_character_hp('character-1', NaN)
    })

    expect(mock_character_api.update).not.toHaveBeenCalled()
    expect(mock_send).not.toHaveBeenCalled()
  })

  it('is a no-op when the character is not in the store', async () => {
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.update_character_hp('missing-character-id', 10)
    })

    expect(mock_character_api.update).not.toHaveBeenCalled()
    expect(mock_send).not.toHaveBeenCalled()
  })

  it('leaves the optimistic HP applied, rejects, and never broadcasts when the save fails', async () => {
    const character = make_character({ id: 'character-1', current_hp: 20, max_hp: 40 })
    character_model.getState().set_character(character)
    mock_character_api.update.mockRejectedValue(new Error('save failed'))
    const { result } = render_combat_viewmodel()

    await expect(
      act(async () => {
        await result.current.update_character_hp('character-1', 15)
      })
    ).rejects.toThrow('save failed')

    expect(character_model.getState().characters['character-1'].current_hp).toBe(15)
    expect(mock_send).not.toHaveBeenCalled()
  })
})

describe('toggle_character_condition', () => {
  it('optimistically adds a condition, persists via REST, and broadcasts condition_update on success', async () => {
    const character = make_character({ id: 'character-1', conditions: ['poisoned'] })
    character_model.getState().set_character(character)
    const server_updated = make_character({ id: 'character-1', conditions: ['poisoned', 'prone'] })
    mock_character_api.update.mockResolvedValue(server_updated)
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.toggle_character_condition('character-1', 'prone')
    })

    expect(mock_character_api.update).toHaveBeenCalledWith('character-1', {
      ...character,
      conditions: ['poisoned', 'prone'],
    })
    expect(character_model.getState().characters['character-1']).toEqual(server_updated)
    expect(mock_send).toHaveBeenCalledWith('condition_update', {
      character_id: 'character-1',
      conditions: ['poisoned', 'prone'],
    })
  })

  it('removes a condition already present when toggled again', async () => {
    const character = make_character({ id: 'character-1', conditions: ['poisoned', 'prone'] })
    character_model.getState().set_character(character)
    mock_character_api.update.mockResolvedValue(make_character({ id: 'character-1', conditions: ['prone'] }))
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.toggle_character_condition('character-1', 'poisoned')
    })

    expect(mock_character_api.update).toHaveBeenCalledWith('character-1', { ...character, conditions: ['prone'] })
  })

  it('is a no-op when the character is not in the store', async () => {
    const { result } = render_combat_viewmodel()

    await act(async () => {
      await result.current.toggle_character_condition('missing-character-id', 'poisoned')
    })

    expect(mock_character_api.update).not.toHaveBeenCalled()
    expect(mock_send).not.toHaveBeenCalled()
  })

  it('leaves the optimistic condition applied, rejects, and never broadcasts when the save fails', async () => {
    const character = make_character({ id: 'character-1', conditions: [] })
    character_model.getState().set_character(character)
    mock_character_api.update.mockRejectedValue(new Error('save failed'))
    const { result } = render_combat_viewmodel()

    await expect(
      act(async () => {
        await result.current.toggle_character_condition('character-1', 'poisoned')
      })
    ).rejects.toThrow('save failed')

    expect(character_model.getState().characters['character-1'].conditions).toEqual(['poisoned'])
    expect(mock_send).not.toHaveBeenCalled()
  })
})

describe('dice_roller_model', () => {
  it('sets a validation error and does not send a roll request for invalid notation', () => {
    const { result } = render_dice_roller()

    act(() => {
      result.current.on_notation_change({ target: { value: 'not-dice' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_roll_press('character-1', 'Aria')
    })

    expect(result.current.validation_error).toBe('Enter valid dice notation, e.g. 2d6+3 or 1d20')
    expect(result.current.is_rolling).toBe(false)
    expect(mock_send).not.toHaveBeenCalled()
  })

  it('clears any validation error, starts rolling, and sends dice_roll_request for valid notation', () => {
    const { result } = render_dice_roller()

    act(() => {
      result.current.on_notation_change({ target: { value: '2d6+3' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_roll_press('character-1', 'Aria')
    })

    expect(result.current.validation_error).toBeNull()
    expect(result.current.is_rolling).toBe(true)
    expect(mock_send).toHaveBeenCalledWith('dice_roll_request', {
      notation: '2d6+3',
      character_id: 'character-1',
      roller_name: 'Aria',
    })
  })

  it('ignores another roller\'s concurrent result and only clears the waiting state for the matching roller_id', () => {
    const { result } = render_dice_roller()

    act(() => {
      result.current.on_notation_change({ target: { value: '1d20' } } as React.ChangeEvent<HTMLInputElement>)
    })
    act(() => {
      result.current.on_roll_press('character-1', 'Aria')
    })
    expect(result.current.is_rolling).toBe(true)

    // Another player's roll result round-trips back over the WS connection first (see
    // dispatch_websocket_event in util/websockets.ts, which calls set_last_dice_roll_result
    // for every dice_roll_result event regardless of who rolled).
    act(() => {
      combat_model.getState().set_last_dice_roll_result(make_dice_roll_result({ roller_id: 'character-2', total: 8 }))
    })

    expect(result.current.is_rolling).toBe(true)
    expect(result.current.last_result).toBeNull()

    // This roller's own result now arrives and clears the waiting state.
    const own_result = make_dice_roll_result({ roller_id: 'character-1', total: 17 })
    act(() => {
      combat_model.getState().set_last_dice_roll_result(own_result)
    })

    expect(result.current.is_rolling).toBe(false)
    expect(result.current.last_result).toEqual(own_result)
  })
})
