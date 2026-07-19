// VIEW layer — combat tracker (initiative, conditions, HP at a glance)
import { useEffect } from 'react'
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import InitiativeOrder from './initiative_order'
import ConditionBadge from './condition_badge'
import { Card, TopBar } from './components'
import '../../styles/combat_tracker.css'

export default function CombatTracker() {
  const combat = combat_viewmodel()
  const characters = character_viewmodel()
  const session = session_viewmodel()

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
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
