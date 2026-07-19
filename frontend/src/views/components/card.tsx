// Shared component — rounded, elevated content card.
import { HTMLAttributes, ReactNode, useState } from 'react'
import './card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  maximizable?: boolean
  // Controlled mode — when `is_maximized` is provided, the card's maximized state is
  // driven entirely by the caller and no internal toggle button is rendered. When omitted,
  // the card falls back to its standalone behavior (internal state + own toggle button).
  is_maximized?: boolean
}

export default function Card({
  className,
  children,
  maximizable = false,
  is_maximized,
  ...rest
}: CardProps) {
  const is_controlled = is_maximized !== undefined
  const [internal_is_maximized, set_internal_is_maximized] = useState(false)
  const resolved_is_maximized = is_controlled ? is_maximized : internal_is_maximized

  const on_maximize_toggle_press = () => set_internal_is_maximized(!internal_is_maximized)

  const classes = [
    'card',
    maximizable ? 'card--maximizable' : '',
    maximizable && resolved_is_maximized ? 'card--maximized' : '',
    className ?? ''
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {maximizable && !is_controlled && (
        <div className="card__toolbar">
          <button
            type="button"
            className="card__maximize-toggle"
            onClick={on_maximize_toggle_press}
            aria-label={resolved_is_maximized ? 'Restore panel' : 'Maximize panel'}
          >
            {resolved_is_maximized ? '⤡' : '⤢'}
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
