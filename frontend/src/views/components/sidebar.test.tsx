import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import Sidebar from './sidebar'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sams-table-sidebar-collapsed'

beforeEach(() => {
  localStorage.clear()
})

describe('Sidebar', () => {
  it('renders its children', () => {
    render(<Sidebar>Campaign list</Sidebar>)

    expect(screen.getByText('Campaign list')).toBeInTheDocument()
  })

  it('defaults to the left side and renders no toggle when not collapsible', () => {
    const { container } = render(<Sidebar>Campaign list</Sidebar>)

    expect(container.firstChild).toHaveClass('sidebar', 'sidebar--left')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies the right side class when side is right', () => {
    const { container } = render(<Sidebar side="right">Campaign list</Sidebar>)

    expect(container.firstChild).toHaveClass('sidebar--right')
  })

  it('starts expanded when collapsible and no persisted state exists', () => {
    const { container } = render(<Sidebar collapsible>Campaign list</Sidebar>)

    expect(container.firstChild).not.toHaveClass('sidebar--collapsed')
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument()
  })

  it('toggles the collapsed class and persists the new state to localStorage on click', () => {
    const { container } = render(<Sidebar collapsible>Campaign list</Sidebar>)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(container.firstChild).toHaveClass('sidebar--collapsed')
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('true')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))

    expect(container.firstChild).not.toHaveClass('sidebar--collapsed')
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('false')
  })

  it('reads the persisted collapsed state on a fresh mount after remounting', () => {
    const first_render = render(<Sidebar collapsible>Campaign list</Sidebar>)
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('true')
    first_render.unmount()

    const { container } = render(<Sidebar collapsible>Campaign list</Sidebar>)

    expect(container.firstChild).toHaveClass('sidebar--collapsed')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })
})
