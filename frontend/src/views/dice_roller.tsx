// VIEW layer — player dice roller (notation input, client-side validation, WS roll request)
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { Badge, Button, Card, Input } from './components'
import '../../styles/dice_roller.css'

interface DiceRollerProps {
  character_id: string
  character_name: string
}

export default function DiceRoller({ character_id, character_name }: DiceRollerProps) {
  const dice_roller = combat_viewmodel().dice_roller_model()

  const can_roll = !dice_roller.is_rolling

  const on_roll_press = () => {
    dice_roller.on_roll_press(character_id, character_name)
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
