import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Toast from './toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message', () => {
    render(<Toast message="Tile placed" />)

    expect(screen.getByText('Tile placed')).toBeInTheDocument()
  })

  it('defaults to the success variant class', () => {
    render(<Toast message="Tile placed" />)

    expect(screen.getByText('Tile placed')).toHaveClass('toast', 'toast--success')
  })

  it('applies a given variant class', () => {
    render(<Toast message="Save failed" variant="danger" />)

    expect(screen.getByText('Save failed')).toHaveClass('toast--danger')
  })

  it('auto-dismisses after the default duration', async () => {
    render(<Toast message="Tile placed" />)
    expect(screen.getByText('Tile placed')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
    })

    expect(screen.queryByText('Tile placed')).not.toBeInTheDocument()
  })

  it('auto-dismisses after a custom duration', async () => {
    render(<Toast message="Tile placed" duration_milliseconds={1000} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999)
    })
    expect(screen.getByText('Tile placed')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(screen.queryByText('Tile placed')).not.toBeInTheDocument()
  })
})
