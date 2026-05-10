// VIEW layer — combat tracker (initiative, conditions, HP at a glance)
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import InitiativeOrder from './initiative_order'

export default function CombatTracker() {
  const combat = combat_viewmodel()
  const characters = character_viewmodel()
  void characters
  return (
    <div>
      <div>Combat Tracker</div>
      <InitiativeOrder
        entries={combat.initiative_order}
        activeTurnIndex={combat.active_turn_index}
        onAdvanceTurn={combat.advance_turn}
      />
      {/* TODO: per-character HP rows, condition badges */}
    </div>
  )
}
