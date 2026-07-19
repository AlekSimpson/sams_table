// VIEW layer — ordered list of combatants with active-turn highlight
import { InitiativeEntry } from '../types/websocket_types'
import { Badge, Button } from './components'
import '../../styles/initiative_order.css'

interface InitiativeOrderProps {
  entries: InitiativeEntry[]
  activeTurnIndex: number
  onAdvanceTurn: () => void
}

export default function InitiativeOrder({ entries, activeTurnIndex, onAdvanceTurn }: InitiativeOrderProps) {
  return (
    <div className="initiative-order">
      <div className="initiative-order__list">
        {entries.map((entry, index) => (
          <div
            key={entry.character_id}
            className={`initiative-order__row${index === activeTurnIndex ? ' initiative-order__row--active' : ''}`}
          >
            <Badge variant={index === activeTurnIndex ? 'info' : 'neutral'}>{entry.initiative}</Badge>
            <span className="initiative-order__name">{entry.name}</span>
            {entry.is_npc && <Badge variant="neutral">NPC</Badge>}
          </div>
        ))}
      </div>
      <Button variant="primary" size="small" onClick={onAdvanceTurn}>Next Turn</Button>
      {/* TODO: DM-only controls for reordering */}
    </div>
  )
}
