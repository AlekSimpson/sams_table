// Shared component — frosted-glass top bar with left/center/right slots.
import { HTMLAttributes, ReactNode } from 'react'
import './top_bar.css'

interface TopBarProps extends HTMLAttributes<HTMLElement> {
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
}

export default function TopBar({ title, left, right, children, className, ...rest }: TopBarProps) {
  const classes = ['top-bar', className ?? ''].filter(Boolean).join(' ')
  return (
    <header className={classes} {...rest}>
      <div className="top-bar__left">
        {left}
        {title && <span className="top-bar__title">{title}</span>}
      </div>
      {children && <div className="top-bar__center">{children}</div>}
      {right && <div className="top-bar__right">{right}</div>}
    </header>
  )
}
