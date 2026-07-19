// Shared component — persistent frosted-glass side panel shell.
import { HTMLAttributes, ReactNode, useState } from 'react'
import './sidebar.css'

export type SidebarSide = 'left' | 'right'

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sams-table-sidebar-collapsed'

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  side?: SidebarSide
  collapsible?: boolean
  // Controlled mode — when `collapsed` is provided, the sidebar's collapsed state is
  // driven entirely by the caller and no internal toggle button is rendered. When omitted,
  // the sidebar falls back to its standalone behavior (internal state + own toggle button).
  collapsed?: boolean
  children: ReactNode
}

export default function Sidebar({
  side = 'left',
  collapsible = false,
  collapsed,
  className,
  children,
  ...rest
}: SidebarProps) {
  const is_controlled = collapsed !== undefined
  const [internal_is_collapsed, set_internal_is_collapsed] = useState(
    () => collapsible && localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  )
  const is_collapsed = is_controlled ? collapsed : internal_is_collapsed

  const on_toggle_press = () => {
    const next_is_collapsed = !internal_is_collapsed
    set_internal_is_collapsed(next_is_collapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next_is_collapsed))
  }

  const classes = [
    'sidebar',
    `sidebar--${side}`,
    is_collapsed ? 'sidebar--collapsed' : '',
    className ?? ''
  ].filter(Boolean).join(' ')

  return (
    <aside className={classes} {...rest}>
      {collapsible && !is_controlled && (
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
