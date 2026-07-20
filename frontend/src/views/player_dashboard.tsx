// VIEW layer — player dashboard (character sheet + map). Sidebar lists every character
// the signed-in player owns (like switching between notes in Notes.app) — selecting one
// swaps the route param without unmounting this shell.
import { useEffect, useState } from 'react'
import { character_viewmodel } from "../viewmodels/character_viewmodel"
import { session_viewmodel } from "../viewmodels/session_viewmodel"
import { notification_viewmodel } from "../viewmodels/notification_viewmodel"
import { useParams } from 'react-router-dom'
import CharacterSheet from './character_sheet'
import PlayerMapPanel from './player_map_panel'
import { DNDCharacter } from '../types/dnd_types'
import { PlayerDashboardParameters } from "../types/app_types"
import { Avatar, Button, Card, NotificationCenter, SessionStatusBar, Sidebar, SIDEBAR_COLLAPSED_STORAGE_KEY, TopBar } from './components'
import '../../styles/player_dashboard.css'

interface CharacterSidebarItemProps {
  character: DNDCharacter
  is_selected: boolean
  on_select: () => void
}

function CharacterSidebarItem({ character, is_selected, on_select }: CharacterSidebarItemProps) {
  const { character_card_model } = character_viewmodel()
  const model = character_card_model(character, is_selected)

  const on_row_click = () => {
    model.on_card_click()
    on_select()
  }

  return (
    <div
      className={`character-sidebar-item${is_selected ? ' character-sidebar-item--active' : ''}`}
      onClick={on_row_click}
      role="button"
      tabIndex={0}
    >
      <Avatar size="small" label={character.name?.[0]?.toUpperCase() ?? '?'} />
      <div className="character-sidebar-item__info">
        <div className="character-sidebar-item__name">
          {character.name || 'Unnamed Character'}
        </div>
        <div className="character-sidebar-item__identity">
          {model.identity_parts.length > 0 ? model.identity_parts.join(' · ') : 'No class or race set'}
        </div>
      </div>
      <button
        type="button"
        className="character-sidebar-item__delete-btn"
        onClick={model.on_delete_click}
        aria-label={`Delete ${character.name}`}
      >
        ×
      </button>
    </div>
  )
}

export default function PlayerDashboard() {
  const { character_id } = useParams<PlayerDashboardParameters>()
  const { characters, load_user_characters, create_new_character_for_user, player_dashboard_model } = character_viewmodel()
  const { join_code_model, active_map_id, user, logout } = session_viewmodel()
  const { notifications, remove_notification } = notification_viewmodel()

  // Focus mode merges the sidebar-collapse and pane-maximize toggles into one boolean,
  // driving both the Sidebar and Card's controlled state at once. Persisted under the same
  // key the sidebar previously used standalone, since it's the same underlying preference.
  const [is_focus_mode, set_is_focus_mode] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  )
  const on_focus_mode_toggle_press = () => {
    const next_is_focus_mode = !is_focus_mode
    set_is_focus_mode(next_is_focus_mode)
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next_is_focus_mode))
  }

  // Called unconditionally, before any early return, so this component's hook order
  // never changes across renders — needed for direct URLs (bookmark/refresh) where
  // `characters` starts out empty and only the effect below populates it.
  const model = player_dashboard_model()
  const join_code = join_code_model()

  useEffect(() => {
    if (!user) return
    load_user_characters(user.id)
  }, [user?.id])

  if (!character_id) return null

  const character = characters[character_id]
  const character_list = Object.values(characters)
  const is_in_session = active_map_id !== null

  const on_new_character_press = () => {
    if (!user) return
    create_new_character_for_user(user.id, `New Character ${character_list.length + 1}`)
  }

  if (!character) return <div>Character not found</div>

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
            on_logout_press={logout}
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
        <Sidebar collapsed={is_focus_mode}>
          <div className="player-dashboard__sidebar-header">
            <span className="section-label">Characters</span>
            <Button variant="ghost" size="small" onClick={on_new_character_press} aria-label="New Character">
              +
            </Button>
          </div>
          <nav className="player-dashboard__character-list">
            {character_list.map((list_character) => (
              <CharacterSidebarItem
                key={list_character.id}
                character={list_character}
                is_selected={list_character.id === character_id}
                on_select={model.on_sheet_tab_press}
              />
            ))}
          </nav>
        </Sidebar>

        <Card
          maximizable
          is_maximized={is_focus_mode}
          className="player-dashboard__panel"
        >
          <div className="pane-toolbar">
            <button
              type="button"
              className="pane-focus-toggle"
              onClick={on_focus_mode_toggle_press}
              aria-label={is_focus_mode ? 'Exit focus mode' : 'Enter focus mode'}
            >
              {is_focus_mode ? '⤡' : '⤢'}
            </button>
          </div>
          <main className="player-dashboard__content">
            {model.current_tab === 'sheet' && <CharacterSheet character_id={character_id} />}
            {model.current_tab === 'map' && <PlayerMapPanel active_map_id={active_map_id} />}
          </main>
        </Card>
      </div>
    </div>
  )
}
