import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Card from './card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Character stats</Card>)

    expect(screen.getByText('Character stats')).toBeInTheDocument()
  })

  it('does not render a maximize toggle when maximizable is false', () => {
    render(<Card>Character stats</Card>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a maximize toggle in the restored state when maximizable is true', () => {
    const { container } = render(<Card maximizable>Character stats</Card>)

    expect(container.firstChild).toHaveClass('card--maximizable')
    expect(container.firstChild).not.toHaveClass('card--maximized')
    expect(screen.getByRole('button', { name: 'Maximize panel' })).toBeInTheDocument()
  })

  it('maximizes on toggle click, then restores on a second click, staying reachable throughout', () => {
    const { container } = render(<Card maximizable>Character stats</Card>)

    fireEvent.click(screen.getByRole('button', { name: 'Maximize panel' }))

    expect(container.firstChild).toHaveClass('card--maximized')
    const restore_button = screen.getByRole('button', { name: 'Restore panel' })
    expect(restore_button).toBeInTheDocument()

    fireEvent.click(restore_button)

    expect(container.firstChild).not.toHaveClass('card--maximized')
    expect(screen.getByRole('button', { name: 'Maximize panel' })).toBeInTheDocument()
  })

  describe('controlled mode (is_maximized)', () => {
    it('reflects a maximized is_maximized prop and renders no internal toggle button', () => {
      const { container } = render(
        <Card maximizable is_maximized>Character stats</Card>
      )

      expect(container.firstChild).toHaveClass('card--maximized')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('reflects a restored is_maximized prop and still renders no internal toggle button', () => {
      const { container } = render(
        <Card maximizable is_maximized={false}>Character stats</Card>
      )

      expect(container.firstChild).not.toHaveClass('card--maximized')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
