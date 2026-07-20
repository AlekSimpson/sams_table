import { character_api, rules_api } from '../util/rest_client'
import { rules } from '../util/dnd_rules'
import { Tab, DashboardTab } from '../types/app_types'
import { DNDCharacter, DNDClass, DNDRace } from '../types/dnd_types'
import { character_model } from '../models/character_model'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ABILITIES: { key: string; label: string; }[] = [
  { key: 'str', label: 'Strength',     },
  { key: 'dex', label: 'Dexterity',    },
  { key: 'con', label: 'Constitution', },
  { key: 'int', label: 'Intelligence', },
  { key: 'wis', label: 'Wisdom',       },
  { key: 'cha', label: 'Charisma',     },
]

const SKILLS: { name: string; ability: string; key: string }[] = [
  { name: 'Acrobatics',      ability: 'dex', key: 'acrobatics' },
  { name: 'Animal Handling', ability: 'wis', key: 'animal_handling' },
  { name: 'Arcana',          ability: 'int', key: 'arcana' },
  { name: 'Athletics',       ability: 'str', key: 'athletics' },
  { name: 'Deception',       ability: 'cha', key: 'deception' },
  { name: 'History',         ability: 'int', key: 'history' },
  { name: 'Insight',         ability: 'wis', key: 'insight' },
  { name: 'Intimidation',    ability: 'cha', key: 'intimidation' },
  { name: 'Investigation',   ability: 'int', key: 'investigation' },
  { name: 'Medicine',        ability: 'wis', key: 'medicine' },
  { name: 'Nature',          ability: 'int', key: 'nature' },
  { name: 'Perception',      ability: 'wis', key: 'perception' },
  { name: 'Performance',     ability: 'cha', key: 'performance' },
  { name: 'Persuasion',      ability: 'cha', key: 'persuasion' },
  { name: 'Religion',        ability: 'int', key: 'religion' },
  { name: 'Sleight of Hand', ability: 'dex', key: 'sleight_of_hand' },
  { name: 'Stealth',         ability: 'dex', key: 'stealth' },
  { name: 'Survival',        ability: 'wis', key: 'survival' },
]

const TABS: { id: Tab; label: string }[] = [
  { id: 'combat',    label: 'Combat' },
  { id: 'spells',    label: 'Spells' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'features',  label: 'Features & Traits' },
  { id: 'notes',     label: 'Notes' },
]

export function character_viewmodel() {
  const { characters, set_characters, set_character, remove_character, update_hp, update_conditions} = character_model()
  const navigate = useNavigate()
  //const { send } = useWebSocket()

  function player_dashboard_model() {
    const [current_tab, set_current_tab] = useState<DashboardTab>('sheet')

    const on_sheet_tab_press = () => set_current_tab('sheet')
    const on_map_tab_press   = () => set_current_tab('map')

    return {
      current_tab,
      set_current_tab,
      on_sheet_tab_press,
      on_map_tab_press
    }
  }

  function character_sheet_model(character: DNDCharacter) {
    const ability_modifier = (score: number) => Math.floor((score - 10) / 2)
    const format_modifier = (score: number) => { 
      const modifier = ability_modifier(score)
      return modifier >= 0 ? `+${modifier}` : `${modifier}` 
    }
    const proficiency_bonus = rules.proficiency_bonus

    const [active_tab, set_active_tab]     = useState<Tab>('combat')
    const [inspiration, set_inspiration]   = useState(false)
    const [classes, set_classes]           = useState<DNDClass[]>([])
    const [races, set_races]               = useState<DNDRace[]>([])

    // Fetches the class/race rules catalog once per sheet mount, to populate the
    // class/race pickers below — see rules_api / dnd_rules.ts.
    useEffect(() => {
      rules_api.get_classes().then(set_classes)
      rules_api.get_races().then(set_races)
    }, [])

    // Holds the pre-edit value for a field currently being edited, so a failed
    // save can roll the optimistic update back. Reset to null once committed.
    const hp_value_before_edit    = useRef<number | null>(null)
    const notes_value_before_edit = useRef<string | null>(null)
    const notes_debounce_timeout  = useRef<ReturnType<typeof setTimeout> | null>(null)

    const patch      = (partial_character: Partial<DNDCharacter>) => update_character(character.id, partial_character)
    const patch_stat = (key: string, value: number) =>
      patch({ stats: { ...character.stats, [key]: value } })

    const on_name_change        = (event: React.ChangeEvent<HTMLInputElement>) => patch({ name: event.target.value })

    // Picking a class also recomputes starting max/current HP from the class's hit die
    // and the character's current level + CON, via rules.calculate_max_hp — replacing
    // the mock backend's hardcoded starting max_hp of 10.
    const on_class_change = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selected_class = classes.find((dnd_class) => dnd_class.key === event.target.value)
      if (!selected_class) { patch({ class: '' }); return }
      const starting_max_hp = rules.calculate_max_hp(selected_class, character.level, character.stats.con)
      patch({ class: selected_class.name, max_hp: starting_max_hp, current_hp: starting_max_hp })
    }

    const on_race_change = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selected_race = races.find((dnd_race) => dnd_race.key === event.target.value)
      patch({ race: selected_race?.name ?? '' })
    }

    const selected_class_key = classes.find((dnd_class) => dnd_class.name === character.class)?.key ?? ''
    const selected_race_key  = races.find((dnd_race) => dnd_race.name === character.race)?.key ?? ''

    const on_max_hp_change      = (event: React.ChangeEvent<HTMLInputElement>) => patch({ max_hp: parseInt(event.target.value) })
    const on_ac_change          = (event: React.ChangeEvent<HTMLInputElement>) => patch({ armor_class: parseInt(event.target.value) })
    const on_speed_change       = (event: React.ChangeEvent<HTMLInputElement>) => patch({ speed: parseInt(event.target.value) })
    const on_level_change       = (event: React.ChangeEvent<HTMLInputElement>) => patch({ level: parseInt(event.target.value) })
    const on_inspiration_toggle = () => set_inspiration(!inspiration)

    // Current HP is a transient, frequently-edited field: update local state on every
    // keystroke (optimistic, no network call), then persist once editing settles (on
    // blur, or immediately for the +/- stepper buttons since those have no blur event).
    // On a failed save, roll back to the value captured before the edit started.
    const commit_current_hp = async (next_current_hp: number, previous_current_hp: number) => {
      try {
        const server_updated = await character_api.update(character.id, { current_hp: next_current_hp })
        set_character(server_updated)
      } catch {
        set_character({ ...character, current_hp: previous_current_hp })
      }
    }

    const on_current_hp_focus = () => {
      hp_value_before_edit.current = character.current_hp
    }

    const on_current_hp_change = (event: React.ChangeEvent<HTMLInputElement>) =>
      set_character({ ...character, current_hp: parseInt(event.target.value) })

    const on_current_hp_blur = () => {
      const previous_current_hp = hp_value_before_edit.current ?? character.current_hp
      hp_value_before_edit.current = null
      commit_current_hp(character.current_hp, previous_current_hp)
    }

    const on_current_hp_step = (delta: number) => () => {
      const previous_current_hp = character.current_hp
      const next_current_hp = Math.max(0, Math.min(character.max_hp, character.current_hp + delta))
      set_character({ ...character, current_hp: next_current_hp })
      commit_current_hp(next_current_hp, previous_current_hp)
    }

    // Notes: optimistic on every keystroke, save debounced 500ms after typing stops.
    const commit_notes = async (next_notes: string, previous_notes: string) => {
      try {
        const server_updated = await character_api.update(character.id, { notes: next_notes })
        set_character(server_updated)
      } catch {
        set_character({ ...character, notes: previous_notes })
      }
    }

    const on_notes_change = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next_notes = event.target.value
      if (notes_value_before_edit.current === null) {
        notes_value_before_edit.current = character.notes
      }
      set_character({ ...character, notes: next_notes })

      if (notes_debounce_timeout.current !== null) {
        clearTimeout(notes_debounce_timeout.current)
      }
      notes_debounce_timeout.current = setTimeout(() => {
        const previous_notes = notes_value_before_edit.current ?? next_notes
        notes_value_before_edit.current = null
        commit_notes(next_notes, previous_notes)
      }, 500)
    }

    // Equipment: add/remove items, optimistic + saved immediately on each change.
    const commit_equipment = async (next_equipment: string[], previous_equipment: string[]) => {
      try {
        const server_updated = await character_api.update(character.id, { equipment: next_equipment })
        set_character(server_updated)
      } catch {
        set_character({ ...character, equipment: previous_equipment })
      }
    }

    const on_equipment_add = (item_name: string) => {
      const trimmed_item_name = item_name.trim()
      if (!trimmed_item_name) return
      const previous_equipment = character.equipment
      const next_equipment = [...character.equipment, trimmed_item_name]
      set_character({ ...character, equipment: next_equipment })
      commit_equipment(next_equipment, previous_equipment)
    }

    const on_equipment_remove = (item_index: number) => {
      const previous_equipment = character.equipment
      const next_equipment = character.equipment.filter((_, index) => index !== item_index)
      set_character({ ...character, equipment: next_equipment })
      commit_equipment(next_equipment, previous_equipment)
    }

    // for loop-rendered inputs
    const on_stat_change = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => patch_stat(key, parseInt(event.target.value))
    const on_tab_select  = (tab: Tab)                  => () => set_active_tab(tab)

    const is_skill_proficient = (skill_key: string) => (character.skill_profs ?? []).includes(skill_key)

    const health_percentage = character.max_hp > 0
      ? Math.min(100, Math.max(0, (character.current_hp / character.max_hp) * 100))
      : 0
    const bonus = proficiency_bonus(character.level)
    const hp_bar_class = health_percentage < 25 ? ' cs__hp-bar-fill--critical' : health_percentage < 50 ? ' cs__hp-bar-fill--low' : ''

    const format_skill_modifier = (skill: { ability: string; key: string }) => {
      const modifier = ability_modifier(character.stats[skill.ability]) + (is_skill_proficient(skill.key) ? bonus : 0)
      return modifier >= 0 ? `+${modifier}` : `${modifier}`
    }

    return {
      ABILITIES,
      SKILLS,
      TABS,
      health_percentage,
      active_tab,
      set_active_tab,
      inspiration,
      set_inspiration,
      ability_modifier,
      format_modifier,
      proficiency_bonus,
      classes,
      races,
      selected_class_key,
      selected_race_key,
      on_name_change,
      on_class_change,
      on_race_change,
      on_current_hp_change,
      on_current_hp_focus,
      on_current_hp_blur,
      on_current_hp_step,
      on_max_hp_change,
      on_ac_change,
      on_speed_change,
      on_level_change,
      on_inspiration_toggle,
      on_stat_change,
      on_tab_select,
      on_notes_change,
      on_equipment_add,
      on_equipment_remove,
      is_skill_proficient,
      format_skill_modifier,
      bonus,
      hp_bar_class
    }

  }

  const load_user_characters = useCallback(
    async (user_id: string) => {
      const characters = await character_api.list_user_characters(user_id)
      set_characters(characters)
    }
    , [set_characters]
  )

  const load_character = useCallback(
    async (character_id: string) => {
      const character = await character_api.get(character_id)
      set_character(character)
    }
    , [set_character]
  )

  const load_campaign_characters = useCallback(
    async (campaign_id: string) => {
      const characters = await character_api.list_characters_in_campaign(campaign_id)
      set_characters(characters)
    }
    , [set_characters]
  )

  // Creating a character always immediately opens it in the dashboard (Notes.app-style:
  // "+" both creates and selects the new item) — this is the only entry point for
  // character creation now that it's reachable from both the zero-character /play
  // empty state and the player dashboard sidebar's "+ New Character" affordance.
  const create_new_character_for_user = useCallback(
    async (user_id: string, character_name: string) => {
      const new_character = await character_api.create(user_id, { name: character_name })
      set_character(new_character)
      navigate(`/play/dashboard/${new_character.id}`)
      return new_character
    }
    , [set_character, navigate]
  )

  const delete_character = useCallback(
    async (character_id: string) => {
      await character_api.delete(character_id)
      remove_character(character_id)
    }
    , [remove_character]
  )

  const update_character = useCallback(
    async (character_id: string, patch: Partial<DNDCharacter>) => {
      const target_character = character_model.getState().characters[character_id]
      if (!target_character) return
      const optimistic = { ...target_character, ...patch }
      set_character(optimistic)
      const server_updated = await character_api.update(character_id, optimistic)
      set_character(server_updated)
    },
    [set_character]
  )

  // is_selected: whether this card/row represents the character currently open in the
  // dashboard — used only to decide where to navigate after a successful delete (away
  // from the now-gone character, via /play's own redirect-to-another-character logic;
  // see player_view.tsx). Deleting a character that ISN'T the one currently open should
  // never navigate the player away from what they're looking at.
  function character_card_model(character: DNDCharacter, is_selected: boolean = false) {

    function character_health_percentage(character: DNDCharacter): number {
      if (character.max_hp === 0) return 0
      return Math.min(100, Math.max(0, (character.current_hp / character.max_hp) * 100))
    }

    const on_card_click   = () => navigate(`/play/dashboard/${character.id}`)
    const on_delete_click = (event: React.MouseEvent) => {
      event.stopPropagation()
      if (window.confirm(`Delete ${character.name}? This cannot be undone.`)) {
        delete_character(character.id).then(() => {
          if (is_selected) navigate('/play', { replace: true })
        })
      }
    }

    const health_percentage = character_health_percentage(character)
    const is_low_health = health_percentage < 30
    const identity_parts = [character.class, character.race].filter(Boolean)

    return {
      on_card_click,
      on_delete_click,
      health_percentage,
      is_low_health,
      identity_parts
    }
  }

  return {
    characters,
    load_user_characters,
    load_character,
    load_campaign_characters,
    update_hp,
    update_conditions,
    set_characters,
    create_new_character_for_user,
    delete_character,
    update_character,
    character_sheet_model,
    player_dashboard_model,
    character_card_model
  }
}

