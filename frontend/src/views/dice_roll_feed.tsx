// VIEW layer — shared scrolling feed of dice roll results, visible to all session players
import { useEffect, useRef } from 'react'
import { combat_viewmodel } from '../viewmodels/combat_viewmodel'
import { session_viewmodel } from '../viewmodels/session_viewmodel'
import { Badge, Card } from './components'
import '../../styles/dice_roll_feed.css'

export default function DiceRollFeed() {
  const { dice_roll_history } = combat_viewmodel()
  const session = session_viewmodel()
  const feed_list_reference = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const feed_list_element = feed_list_reference.current
    if (!feed_list_element) return
    feed_list_element.scrollTo({ top: feed_list_element.scrollHeight, behavior: 'smooth' })
  }, [dice_roll_history])

  return (
    <Card className="dice-roll-feed">
      <div className="dice-roll-feed__list" ref={feed_list_reference}>
        {dice_roll_history.map((result, index) => {
          const is_own_roll = result.roller_id === session.character_id
          return (
            <div
              key={index}
              className={`dice-roll-feed__entry${is_own_roll ? ' dice-roll-feed__entry--own' : ''}`}
            >
              <span className="dice-roll-feed__roller">{result.roller_name}</span>
              <Badge variant="info">{result.dice}</Badge>
              <span className="dice-roll-feed__rolls">[{result.results.join(', ')}]</span>
              <span className="dice-roll-feed__total">Total: {result.total}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
