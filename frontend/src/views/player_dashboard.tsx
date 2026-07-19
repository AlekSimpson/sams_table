// VIEW layer — player dashboard (character sheet + map)
import { character_viewmodel } from "../viewmodels/character_viewmodel"
import { session_viewmodel } from "../viewmodels/session_viewmodel"
import { useParams } from 'react-router-dom'
import CharacterSheet from './character_sheet'
import { PlayerDashboardParameters } from "../types/app_types"
import { Button, Card, Input, Sidebar, TopBar } from './components'
import '../../styles/player_dashboard.css'

export default function PlayerDashboard() {
  const { character_id } = useParams<PlayerDashboardParameters>()
  if (!character_id) return null
  const { characters, player_dashboard_model } = character_viewmodel()
  const { join_code_model } = session_viewmodel()
  const character = characters[character_id]
  if (!character) return <div>Character not found</div>
  const model = player_dashboard_model()
  const join_code = join_code_model()

  const on_join_code_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') join_code.on_submit(character.name)
  }

  return (
    <div className="player-dashboard">
      <TopBar
        title={character.name || 'Character'}
        right={
          <div className="player-dashboard__join-code">
            <Input
              className="player-dashboard__campaign-input"
              placeholder="Join Code"
              value={join_code.join_code_draft}
              onChange={join_code.on_join_code_change}
              onKeyDown={on_join_code_key_down}
              disabled={join_code.is_joining}
            />
            <Button
              variant="secondary"
              size="small"
              onClick={() => join_code.on_submit(character.name)}
              disabled={join_code.is_joining || !join_code.join_code_draft.trim()}
            >
              {join_code.is_joining ? 'Joining…' : 'Join'}
            </Button>
            {join_code.join_error && (
              <span className="player-dashboard__join-error" role="alert">{join_code.join_error}</span>
            )}
          </div>
        }
      />

      <div className="player-dashboard__body">
        <Sidebar collapsible>
          <nav className="player-dashboard__nav">
            <Button
              variant={model.current_tab === 'sheet' ? 'secondary' : 'ghost'}
              size="small"
              full_width
              onClick={model.on_sheet_tab_press}
            >
              Character Sheet
            </Button>
            <Button
              variant={model.current_tab === 'map' ? 'secondary' : 'ghost'}
              size="small"
              full_width
              onClick={model.on_map_tab_press}
            >
              Live Map
            </Button>
          </nav>
        </Sidebar>

        <Card maximizable className="player-dashboard__panel">
          <main className="player-dashboard__content">
            {model.current_tab === 'sheet' && <CharacterSheet character_id={character_id} />}
            {model.current_tab === 'map'   && (
              <div className="scaffold-placeholder" style={{ margin: '32px', padding: '60px 20px' }}>
                Live Map — coming soon
              </div>
            )}
          </main>
        </Card>
      </div>
    </div>
  )
}
