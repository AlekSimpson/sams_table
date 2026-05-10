// VIEW layer — ordered list of combatants with active-turn highlight
import { InitiativeEntry } from '../types/websocket_types'

interface InitiativeOrderProps {
  entries: InitiativeEntry[]
  activeTurnIndex: number
  onAdvanceTurn: () => void
}

export default function InitiativeOrder({ entries, activeTurnIndex, onAdvanceTurn }: InitiativeOrderProps) {
  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={entry.character_id}
          style={{ fontWeight: i === activeTurnIndex ? 'bold' : 'normal', padding: '4px 0' }}
        >
          {entry.initiative} — {entry.name}
        </div>
      ))}
      <button onClick={onAdvanceTurn}>Next Turn</button>
      {/* TODO: DM-only controls for reordering, adding NPCs */}
    </div>
  )
}
