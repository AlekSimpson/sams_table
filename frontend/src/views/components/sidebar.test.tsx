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

  describe('controlled mode (collapsed / on_toggle_collapsed)', () => {
    it('reflects the collapsed prop and renders no internal toggle button', () => {
      const { container } = render(
        <Sidebar collapsed on_toggle_collapsed={() => {}}>Campaign list</Sidebar>
      )

      expect(container.firstChild).toHaveClass('sidebar--collapsed')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('reflects an expanded collapsed prop and still renders no internal toggle button', () => {
      const { container } = render(
        <Sidebar collapsed={false} on_toggle_collapsed={() => {}}>Campaign list</Sidebar>
      )

      expect(container.firstChild).not.toHaveClass('sidebar--collapsed')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not render an internal toggle button even when collapsible is also passed', () => {
      render(
        <Sidebar collapsible collapsed on_toggle_collapsed={() => {}}>Campaign list</Sidebar>
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not read from or write to localStorage while controlled', () => {
      render(<Sidebar collapsed on_toggle_collapsed={() => {}}>Campaign list</Sidebar>)

      expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBeNull()
    })
  })
})
