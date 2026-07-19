// Shared component — lightweight grouping panel (no elevation), used inside cards/sidebars.
import { HTMLAttributes, ReactNode } from 'react'
import './panel.css'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Panel({ className, children, ...rest }: PanelProps) {
  const classes = ['panel', className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
