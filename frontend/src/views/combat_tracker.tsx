// VIEW layer — combat tracker (initiative, conditions, HP at a glance)
import { useEffect } from 'react'
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import InitiativeOrder from './initiative_order'
import ConditionBadge from './condition_badge'
import { Button, Card, Input, TopBar } from './components'
import '../../styles/combat_tracker.css'

export default function CombatTracker() {
  const combat = combat_viewmodel()
  const characters = character_viewmodel()
  const session = session_viewmodel()
  const initiative_input = combat.initiative_input_model()

  useEffect(() => {
    if (!session.campaign_id) return
    characters.load_campaign_characters(session.campaign_id)
  }, [session.campaign_id])

  const character_list = Object.values(characters.characters)

  return (
    <div className="combat-tracker">
      <TopBar title="Combat Tracker" />
      <div className="combat-tracker__content">
        <Card>
          <InitiativeOrder
            entries={combat.initiative_order}
            activeTurnIndex={combat.active_turn_index}
            onAdvanceTurn={combat.advance_turn}
          />
        </Card>
        <Card>
          <div className="combat-tracker__roster">
            {character_list.map((character) => (
              <div key={character.id} className="combat-tracker__character-row">
                <span className="combat-tracker__character-name">{character.name}</span>
                <span className="combat-tracker__character-hp">{character.current_hp} / {character.max_hp}</span>
                <div className="combat-tracker__character-conditions">
                  {character.conditions.map((condition) => (
                    <ConditionBadge key={condition} condition={condition} />
                  ))}
                </div>
                <Input
                  className="combat-tracker__initiative-input"
                  type="number"
                  placeholder="Init"
                  aria-label={`${character.name} initiative`}
                  value={initiative_input.character_initiative_drafts[character.id] ?? ''}
                  onChange={initiative_input.on_character_initiative_change(character.id)}
                />
              </div>
            ))}
          </div>

          <div className="combat-tracker__npc-form">
            <Input
              placeholder="NPC name"
              aria-label="NPC name"
              value={initiative_input.npc_name_draft}
              onChange={initiative_input.on_npc_name_change}
            />
            <Input
              className="combat-tracker__initiative-input"
              type="number"
              placeholder="Init"
              aria-label="NPC initiative"
              value={initiative_input.npc_initiative_draft}
              onChange={initiative_input.on_npc_initiative_change}
            />
            <Button variant="secondary" size="small" onClick={initiative_input.on_add_npc_entry}>Add NPC</Button>
          </div>

          {initiative_input.npc_entries.length > 0 && (
            <div className="combat-tracker__npc-list">
              {initiative_input.npc_entries.map((entry) => (
                <div key={entry.character_id} className="combat-tracker__npc-row">
                  <span className="combat-tracker__npc-name">{entry.name} ({entry.initiative})</span>
                  <Button variant="ghost" size="small" onClick={() => initiative_input.on_remove_npc_entry(entry.character_id)}>Remove</Button>
                </div>
              ))}
            </div>
          )}

          <Button
            className="combat-tracker__submit-initiative"
            variant="primary"
            onClick={() => initiative_input.on_submit(character_list)}
          >
            Set Initiative
          </Button>
        </Card>
      </div>
    </div>
  )
}
