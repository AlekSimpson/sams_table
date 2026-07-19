// VIEW layer — player's landing route. Now just a redirect gate: if the player already
// has at least one character, send them straight to its dashboard (the sidebar there
// handles switching between characters — see player_dashboard.tsx). Only a brand-new
// player with zero characters actually sees this page, as an empty state to create one.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { Button, TopBar } from './components'
import '../../styles/player_view.css'

export default function PlayerView() {
  const session = session_viewmodel()
  const navigate = useNavigate()
  const { characters, load_user_characters, create_new_character_for_user } = character_viewmodel()
  const [has_loaded, set_has_loaded] = useState(false)

  const on_create_press = () => {
    if (!session.user) return
    create_new_character_for_user(session.user.id, `New Character ${Object.values(characters).length + 1}`)
  }

  useEffect(() => {
    if (!session.user) return
    load_user_characters(session.user.id).catch(() => {}).then(() => set_has_loaded(true))
  }, [session.user?.id])

  const character_list = Object.values(characters)

  useEffect(() => {
    if (has_loaded && character_list.length > 0) {
      navigate(`/play/dashboard/${character_list[0].id}`, { replace: true })
    }
  }, [has_loaded, character_list.length])

  // Still loading, or about to redirect away — render nothing rather than flash the
  // empty state at a player who actually has characters.
  if (!has_loaded || character_list.length > 0) return null

  return (
    <div className="player-view">
      <TopBar
        title="Characters"
        right={<Button variant="primary" size="small" onClick={on_create_press}>+ New Character</Button>}
      />

      <main className="player-view__content">
        <div className="character-grid character-grid--empty">
          <div className="character-grid__empty-state">
            No characters yet — create one to get started.
          </div>
        </div>
      </main>
    </div>
  )
}
