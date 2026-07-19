// Shared component — persistent frosted-glass side panel shell.
import { HTMLAttributes, ReactNode } from 'react'
import './sidebar.css'

export type SidebarSide = 'left' | 'right'

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  side?: SidebarSide
  children: ReactNode
}

export default function Sidebar({ side = 'left', className, children, ...rest }: SidebarProps) {
  const classes = ['sidebar', `sidebar--${side}`, className ?? ''].filter(Boolean).join(' ')
  return (
    <aside className={classes} {...rest}>
      {children}
    </aside>
  )
}
