// VIEW layer — player dashboard (character sheet + map)
import { character_viewmodel } from "../viewmodels/character_viewmodel"
import { useParams } from 'react-router-dom'
import CharacterSheet from './character_sheet'
import { PlayerDashboardParameters } from "../types/app_types"
import '../../styles/PlayerDashboard.css'

export default function PlayerDashboard() {
  const { character_id } = useParams<PlayerDashboardParameters>()
  if (!character_id) return null
  const { characters, player_dashboard_model } = character_viewmodel()
  const character = characters[character_id]
  if (!character) return <div>Character not found</div>
  const model = player_dashboard_model()

  return (
    <div className="player-dashboard">
      <header className="player-dashboard__header">
        
        <span className="player-dashboard__character-name">{character.name || 'Character'}</span>
        <input className="player-dashboard__campaign-input" placeholder="Campaign ID" />
        <nav className="player-dashboard__nav">
          <button
            className={`player-dashboard__nav-btn${model.current_tab === 'sheet' ? ' player-dashboard__nav-btn--active' : ''}`}
            onClick={model.on_sheet_tab_press}
          >
            Character Sheet
          </button>
          <button
            className={`player-dashboard__nav-btn${model.current_tab === 'map' ? ' player-dashboard__nav-btn--active' : ''}`}
            onClick={model.on_map_tab_press}
          >
            Live Map
          </button>
        </nav>
      </header>

      <main className="player-dashboard__content">
        {model.current_tab === 'sheet' && <CharacterSheet character_id={character_id} />}
        {model.current_tab === 'map'   && (
          <div className="scaffold-placeholder" style={{ margin: '32px', padding: '60px 20px' }}>
            Live Map — coming soon
          </div>
        )}
      </main>
    </div>
  )
}
