// VIEW layer — DM's compact sidebar panel for managing combat state during a session
// (Initiative / HP / Conditions). Reuses combat_viewmodel's initiative_input_model logic
// from the (unmounted) combat_tracker.tsx rather than duplicating it.
import { useEffect } from 'react'
import { combat_viewmodel, COMBAT_CONDITIONS } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { DNDCharacter } from '../types/dnd_types'
import { Badge, Button, Input, Panel } from './components'
import '../../styles/dm_combat_controls_panel.css'

interface DmCombatControlsPanelProps {
  campaign_id: string
}

interface CharacterHpRowProps {
  character: DNDCharacter
  on_hp_change: (character_id: string, new_current_hp: number) => void
}

function CharacterHpRow({ character, on_hp_change }: CharacterHpRowProps) {
  const on_decrement_press = () => on_hp_change(character.id, character.current_hp - 1)
  const on_increment_press = () => on_hp_change(character.id, character.current_hp + 1)
  const on_input_change = (event: React.ChangeEvent<HTMLInputElement>) =>
    on_hp_change(character.id, parseInt(event.target.value, 10))

  return (
    <div className="dm-combat-controls-panel__row">
      <span className="dm-combat-controls-panel__character-name">{character.name}</span>
      <div className="dm-combat-controls-panel__hp-controls">
        <Button variant="ghost" size="small" onClick={on_decrement_press} aria-label={`Decrease ${character.name} HP`}>−</Button>
        <Input
          className="dm-combat-controls-panel__hp-input"
          type="number"
          aria-label={`${character.name} current HP`}
          value={character.current_hp}
          onChange={on_input_change}
        />
        <span className="dm-combat-controls-panel__hp-max">/ {character.max_hp}</span>
        <Button variant="ghost" size="small" onClick={on_increment_press} aria-label={`Increase ${character.name} HP`}>+</Button>
      </div>
    </div>
  )
}

interface CharacterConditionsRowProps {
  character: DNDCharacter
  on_condition_toggle: (character_id: string, condition: string) => void
}

function CharacterConditionsRow({ character, on_condition_toggle }: CharacterConditionsRowProps) {
  return (
    <div className="dm-combat-controls-panel__row dm-combat-controls-panel__row--conditions">
      <span className="dm-combat-controls-panel__character-name">{character.name}</span>
      <div className="dm-combat-controls-panel__condition-chips">
        {COMBAT_CONDITIONS.map((condition) => {
          const is_active = character.conditions.includes(condition)
          return (
            <Button
              key={condition}
              variant={is_active ? 'secondary' : 'ghost'}
              size="small"
              onClick={() => on_condition_toggle(character.id, condition)}
            >
              {condition}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default function DmCombatControlsPanel({ campaign_id }: DmCombatControlsPanelProps) {
  const combat = combat_viewmodel()
  const { characters, load_campaign_characters } = character_viewmodel()
  const initiative_input = combat.initiative_input_model()

  useEffect(() => {
    if (!campaign_id) return
    load_campaign_characters(campaign_id)
  }, [campaign_id, load_campaign_characters])

  const character_list = Object.values(characters)

  return (
    <div className="dm-combat-controls-panel">
      {combat.character_update_error && (
        <span className="dm-combat-controls-panel__error" role="alert">{combat.character_update_error}</span>
      )}

      <Panel className="dm-combat-controls-panel__section">
        <span className="section-label">Initiative</span>

        <div className="dm-combat-controls-panel__list">
          {character_list.map((character) => (
            <div key={character.id} className="dm-combat-controls-panel__row">
              <span className="dm-combat-controls-panel__character-name">{character.name}</span>
              <Input
                className="dm-combat-controls-panel__initiative-input"
                type="number"
                placeholder="Init"
                aria-label={`${character.name} initiative`}
                value={initiative_input.character_initiative_drafts[character.id] ?? ''}
                onChange={initiative_input.on_character_initiative_change(character.id)}
              />
            </div>
          ))}
        </div>

        <div className="dm-combat-controls-panel__npc-form">
          <Input
            placeholder="NPC name"
            aria-label="NPC name"
            value={initiative_input.npc_name_draft}
            onChange={initiative_input.on_npc_name_change}
          />
          <Input
            className="dm-combat-controls-panel__initiative-input"
            type="number"
            placeholder="Init"
            aria-label="NPC initiative"
            value={initiative_input.npc_initiative_draft}
            onChange={initiative_input.on_npc_initiative_change}
          />
          <Button variant="secondary" size="small" onClick={initiative_input.on_add_npc_entry}>Add NPC</Button>
        </div>

        {initiative_input.npc_entries.length > 0 && (
          <div className="dm-combat-controls-panel__npc-list">
            {initiative_input.npc_entries.map((entry) => (
              <div key={entry.character_id} className="dm-combat-controls-panel__npc-row">
                <span className="dm-combat-controls-panel__npc-name">{entry.name} ({entry.initiative})</span>
                <Button variant="ghost" size="small" onClick={() => initiative_input.on_remove_npc_entry(entry.character_id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}

        <Button
          className="dm-combat-controls-panel__publish-button"
          variant="primary"
          size="small"
          full_width
          onClick={() => initiative_input.on_submit(character_list)}
        >
          Publish Order
        </Button>
      </Panel>

      <Panel className="dm-combat-controls-panel__section">
        <span className="section-label">HP</span>
        <div className="dm-combat-controls-panel__list">
          {character_list.length === 0 ? (
            <Badge variant="neutral">No characters yet</Badge>
          ) : (
            character_list.map((character) => (
              <CharacterHpRow key={character.id} character={character} on_hp_change={combat.update_character_hp} />
            ))
          )}
        </div>
      </Panel>

      <Panel className="dm-combat-controls-panel__section">
        <span className="section-label">Conditions</span>
        <div className="dm-combat-controls-panel__list">
          {character_list.length === 0 ? (
            <Badge variant="neutral">No characters yet</Badge>
          ) : (
            character_list.map((character) => (
              <CharacterConditionsRow
                key={character.id}
                character={character}
                on_condition_toggle={combat.toggle_character_condition}
              />
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}
