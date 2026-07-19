// VIEW layer — player dice roller (notation input, client-side validation, WS roll request)
import { useEffect } from 'react'
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { Badge, Button, Card, Input } from './components'
import '../../styles/dice_roller.css'

export default function DiceRoller() {
  const session = session_viewmodel()
  const { characters, load_campaign_characters } = character_viewmodel()
  const dice_roller = combat_viewmodel().dice_roller_model()

  useEffect(() => {
    if (!session.campaign_id) return
    load_campaign_characters(session.campaign_id)
  }, [session.campaign_id])

  const character = session.character_id ? characters[session.character_id] : null
  const roller_name = character?.name ?? session.user?.username ?? 'Unknown'
  const can_roll = session.character_id !== null && !dice_roller.is_rolling

  const on_roll_press = () => {
    if (!session.character_id) return
    dice_roller.on_roll_press(session.character_id, roller_name)
  }

  return (
    <Card className="dice-roller">
      <div className="dice-roller__form">
        <Input
          id="dice-roller-notation-input"
          label="Dice Notation"
          placeholder="2d6+3"
          value={dice_roller.notation_draft}
          onChange={dice_roller.on_notation_change}
          disabled={dice_roller.is_rolling}
        />
        <Button variant="primary" onClick={on_roll_press} disabled={!can_roll}>
          {dice_roller.is_rolling ? 'Rolling…' : 'Roll'}
        </Button>
      </div>

      {dice_roller.validation_error && (
        <span className="dice-roller__error" role="alert">{dice_roller.validation_error}</span>
      )}

      {dice_roller.last_result && (
        <div className="dice-roller__result">
          <Badge variant="info">{dice_roller.last_result.dice}</Badge>
          <span className="dice-roller__result-rolls">[{dice_roller.last_result.results.join(', ')}]</span>
          <span className="dice-roller__result-total">Total: {dice_roller.last_result.total}</span>
        </div>
      )}
    </Card>
  )
}
