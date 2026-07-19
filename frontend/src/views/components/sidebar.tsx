// Shared component — persistent frosted-glass side panel shell.
import { HTMLAttributes, ReactNode, useState } from 'react'
import './sidebar.css'

export type SidebarSide = 'left' | 'right'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sams-table-sidebar-collapsed'

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  side?: SidebarSide
  collapsible?: boolean
  children: ReactNode
}

export default function Sidebar({ side = 'left', collapsible = false, className, children, ...rest }: SidebarProps) {
  const [is_collapsed, set_is_collapsed] = useState(
    () => collapsible && localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  )

  const on_toggle_press = () => {
    const next_is_collapsed = !is_collapsed
    set_is_collapsed(next_is_collapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next_is_collapsed))
  }

  const classes = [
    'sidebar',
    `sidebar--${side}`,
    collapsible && is_collapsed ? 'sidebar--collapsed' : '',
    className ?? ''
  ].filter(Boolean).join(' ')

  return (
    <aside className={classes} {...rest}>
      {collapsible && (
        <button
          type="button"
          className="sidebar__toggle"
          onClick={on_toggle_press}
          aria-label={is_collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {is_collapsed ? '›' : '‹'}
        </button>
      )}
      {children}
    </aside>
  )
}
