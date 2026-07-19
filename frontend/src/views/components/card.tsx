// Shared component — rounded, elevated content card.
import { HTMLAttributes, ReactNode } from 'react'
import './card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ className, children, ...rest }: CardProps) {
  const classes = ['card', className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
