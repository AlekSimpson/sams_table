import { character_api } from '../util/rest_client'
import { Tab, DashboardTab } from '../types/app_types'
import { DNDCharacter } from '../types/dnd_types'
import { character_model } from '../models/character_model'
import { useState, useCallback } from 'react'
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
    const proficiency_bonus = (level: number) => 2 + Math.floor(Math.max(0, level - 1) / 4)

    const [active_tab, set_active_tab]     = useState<Tab>('combat')
    const [inspiration, set_inspiration]   = useState(false)

    const patch      = (partial_character: Partial<DNDCharacter>) => update_character(character.id, partial_character)
    const patch_stat = (key: string, value: number) =>
      patch({ stats: { ...character.stats, [key]: value } })

    const on_name_change        = (event: React.ChangeEvent<HTMLInputElement>) => patch({ name: event.target.value })
    const on_class_change       = (event: React.ChangeEvent<HTMLInputElement>) => patch({ class: event.target.value })
    const on_race_change        = (event: React.ChangeEvent<HTMLInputElement>) => patch({ race: event.target.value })
    const on_current_hp_change  = (event: React.ChangeEvent<HTMLInputElement>) => patch({ current_hp: parseInt(event.target.value) })
    const on_max_hp_change      = (event: React.ChangeEvent<HTMLInputElement>) => patch({ max_hp: parseInt(event.target.value) })
    const on_ac_change          = (event: React.ChangeEvent<HTMLInputElement>) => patch({ armor_class: parseInt(event.target.value) })
    const on_speed_change       = (event: React.ChangeEvent<HTMLInputElement>) => patch({ speed: parseInt(event.target.value) })
    const on_level_change       = (event: React.ChangeEvent<HTMLInputElement>) => patch({ level: parseInt(event.target.value) })
    const on_inspiration_toggle = () => set_inspiration(!inspiration)

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
      on_name_change,
      on_class_change,
      on_race_change,
      on_current_hp_change,
      on_max_hp_change,
      on_ac_change,
      on_speed_change,
      on_level_change,
      on_inspiration_toggle,
      on_stat_change,
      on_tab_select,
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

  const create_new_character_for_user = useCallback(
    async (user_id: string, character_name: string) => {
      const new_character = await character_api.create(user_id, { name: character_name })
      set_character(new_character)
    }
    , [set_character]
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

  function character_card_model(character: DNDCharacter) {

    function character_health_percentage(character: DNDCharacter): number {
      if (character.max_hp === 0) return 0
      return Math.min(100, Math.max(0, (character.current_hp / character.max_hp) * 100))
    }

    const on_card_click   = () => navigate(`/play/dashboard/${character.id}`)
    const on_delete_click = (event: React.MouseEvent) => {
      event.stopPropagation()
      if (window.confirm(`Delete ${character.name}? This cannot be undone.`)) {
        delete_character(character.id)
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

