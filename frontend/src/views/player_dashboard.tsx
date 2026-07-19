// VIEW layer — player dashboard (character sheet + map)
import { character_viewmodel } from "../viewmodels/character_viewmodel"
import { session_viewmodel } from "../viewmodels/session_viewmodel"
import { notification_viewmodel } from "../viewmodels/notification_viewmodel"
import { useParams } from 'react-router-dom'
import CharacterSheet from './character_sheet'
import MapScene from './todo_views/map_view/map_view'
import { PlayerDashboardParameters } from "../types/app_types"
import { Button, Card, NotificationCenter, SessionStatusBar, Sidebar, TopBar } from './components'
import '../../styles/player_dashboard.css'

export default function PlayerDashboard() {
  const { character_id } = useParams<PlayerDashboardParameters>()
  if (!character_id) return null
  const { characters, player_dashboard_model } = character_viewmodel()
  const { join_code_model, active_map_id } = session_viewmodel()
  const { notifications, remove_notification } = notification_viewmodel()
  const character = characters[character_id]
  if (!character) return <div>Character not found</div>
  const model = player_dashboard_model()
  const join_code = join_code_model()
  const is_in_session = active_map_id !== null

  const on_join_code_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') join_code.on_submit(character.name)
  }

  return (
    <div className="player-dashboard">
      <NotificationCenter notifications={notifications} on_dismiss={remove_notification} />
      <TopBar
        title={character.name || 'Character'}
        right={
          <SessionStatusBar
            role="player"
            is_in_session={is_in_session}
            player_props={{
              join_code_draft: join_code.join_code_draft,
              on_join_code_change: join_code.on_join_code_change,
              on_join_code_key_down,
              on_join_press: () => join_code.on_submit(character.name),
              is_joining: join_code.is_joining,
              join_error: join_code.join_error,
              on_live_map_press: model.on_map_tab_press,
            }}
          />
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
          </nav>
        </Sidebar>

        <Card maximizable className="player-dashboard__panel">
          <main className="player-dashboard__content">
            {model.current_tab === 'sheet' && <CharacterSheet character_id={character_id} />}
            {model.current_tab === 'map' && (
              active_map_id ? (
                // Player view is always view-only: build tooling (tile placement, the
                // asset catalogue) is DM-only and lives in dm_map_panel.tsx instead.
                <MapScene mode="view" map_id={active_map_id} />
              ) : (
                <div className="scaffold-placeholder" style={{ margin: '32px', padding: '60px 20px' }}>
                  Not in a session — join with a code to view the live map
                </div>
              )
            )}
          </main>
        </Card>
      </div>
    </div>
  )
}
