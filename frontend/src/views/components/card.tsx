// Shared component — rounded, elevated content card.
import { HTMLAttributes, ReactNode, useState } from 'react'
import './card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  maximizable?: boolean
}

export default function Card({ className, children, maximizable = false, ...rest }: CardProps) {
  const [is_maximized, set_is_maximized] = useState(false)

  const on_maximize_toggle_press = () => set_is_maximized(!is_maximized)

  const classes = [
    'card',
    maximizable ? 'card--maximizable' : '',
    maximizable && is_maximized ? 'card--maximized' : '',
    className ?? ''
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {maximizable && (
        <div className="card__toolbar">
          <button
            type="button"
            className="card__maximize-toggle"
            onClick={on_maximize_toggle_press}
            aria-label={is_maximized ? 'Restore panel' : 'Maximize panel'}
          >
            {is_maximized ? '⤡' : '⤢'}
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
