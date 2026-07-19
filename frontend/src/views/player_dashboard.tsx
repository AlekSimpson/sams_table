// VIEW layer — player dashboard (character sheet + map)
import { character_viewmodel } from "../viewmodels/character_viewmodel"
import { useParams } from 'react-router-dom'
import CharacterSheet from './character_sheet'
import { PlayerDashboardParameters } from "../types/app_types"
import { Button, Input, TopBar } from './components'
import '../../styles/player_dashboard.css'

export default function PlayerDashboard() {
  const { character_id } = useParams<PlayerDashboardParameters>()
  if (!character_id) return null
  const { characters, player_dashboard_model } = character_viewmodel()
  const character = characters[character_id]
  if (!character) return <div>Character not found</div>
  const model = player_dashboard_model()

  return (
    <div className="player-dashboard">
      <TopBar
        title={character.name || 'Character'}
        right={<Input className="player-dashboard__campaign-input" placeholder="Campaign ID" />}
      >
        <nav className="player-dashboard__nav">
          <Button
            variant={model.current_tab === 'sheet' ? 'secondary' : 'ghost'}
            size="small"
            onClick={model.on_sheet_tab_press}
          >
            Character Sheet
          </Button>
          <Button
            variant={model.current_tab === 'map' ? 'secondary' : 'ghost'}
            size="small"
            onClick={model.on_map_tab_press}
          >
            Live Map
          </Button>
        </nav>
      </TopBar>

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
