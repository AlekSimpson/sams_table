// VIEW layer — combat tracker (initiative, conditions, HP at a glance)
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import InitiativeOrder from './initiative_order'
import { Card, TopBar } from './components'
import '../../styles/combat_tracker.css'

export default function CombatTracker() {
  const combat = combat_viewmodel()
  const characters = character_viewmodel()
  void characters
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
        {/* TODO: per-character HP rows, condition badges */}
      </div>
    </div>
  )
}
