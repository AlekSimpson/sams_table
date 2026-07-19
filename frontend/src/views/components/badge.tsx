// Shared component — small status/tag pill.
import { HTMLAttributes, ReactNode } from 'react'
import './badge.css'

export type BadgeVariant = 'neutral' | 'danger' | 'success' | 'warning' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

export default function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  const classes = ['badge', `badge--${variant}`, className ?? ''].filter(Boolean).join(' ')
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
