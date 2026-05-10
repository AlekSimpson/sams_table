// VIEW layer — player's character selection view
import { useEffect } from 'react'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { DNDCharacter } from '../types/dnd_types'
import '../../styles/PlayerView.css'

interface CharacterCardProps {
  character: DNDCharacter
}

function CharacterCard({ character }: CharacterCardProps) {
  const { character_card_model } = character_viewmodel()
  const model = character_card_model(character)

  return (
    <div className="character-card" onClick={model.on_card_click}>
      <div className="character-card__top">
        <div className="character-card__portrait">
          {character.name?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="character-card__info">
          <div className="character-card__name">
            {character.name || 'Unnamed Character'}
          </div>
          <div className="character-card__identity">
            {model.identity_parts.length > 0 ? model.identity_parts.join(' · ') : 'No class or race set'}
          </div>
        </div>
      </div>

      <button className="btn btn--danger character-card__delete-btn" onClick={model.on_delete_click}>
        Delete
      </button>

      <div className="character-card__stats">
        <div className="character-card__stat">
          <span className={`character-card__stat-value${model.is_low_health ? ' character-card__stat-value--danger' : ''}`}>
            {character.current_hp}/{character.max_hp}
          </span>
          <span className="character-card__stat-label">HP</span>
        </div>
        <div className="character-card__stat">
          <span className="character-card__stat-value">{character.armor_class}</span>
          <span className="character-card__stat-label">AC</span>
        </div>
        <div className="character-card__stat">
          <span className="character-card__stat-value">{character.speed}</span>
          <span className="character-card__stat-label">Speed</span>
        </div>
      </div>

      <div className="character-card__hp-bar">
        <div className="character-card__hp-bar-fill" style={{ width: `${model.health_percentage}%` }} />
      </div>
    </div>
  )
}

export default function PlayerView() {
  const session = session_viewmodel()
  const { characters, load_user_characters, create_new_character_for_user } = character_viewmodel()

  const on_create_press = () => {
    if (!session.user) return
    create_new_character_for_user(session.user.id, `New Character ${Object.values(characters).length + 1}`)
  }

  useEffect(() => {
    if (!session.user) return
    load_user_characters(session.user.id)
  }, [session.user?.id])

  const character_list = Object.values(characters)

  return (
    <div className="player-view">
      <header className="player-view__header">
        <h1 className="player-view__title">Characters</h1>
        <button className="btn btn--primary btn--sm" onClick={on_create_press}>
          + New Character
        </button>
      </header>

      <main className="player-view__content">
        {character_list.length === 0 ? (
          <div className="character-grid character-grid--empty">
            <div className="character-grid__empty-state">
              No characters yet — create one to get started.
            </div>
          </div>
        ) : (
          <div className="character-grid">
            {character_list.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
