import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationCenter from './notification_center'
import { SessionNotification } from '../../types/app_types'

function make_notification(overrides: Partial<SessionNotification> = {}): SessionNotification {
  return {
    id: 'notification-1',
    message: 'Tile placed',
    variant: 'success',
    created_at: 0,
    ...overrides,
  }
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there are no notifications', () => {
    const { container } = render(<NotificationCenter notifications={[]} on_dismiss={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a toast for each notification, so simultaneous events stack rather than clobbering each other', () => {
    render(
      <NotificationCenter
        notifications={[
          make_notification({ id: 'notification-1', message: 'Tile placed' }),
          make_notification({ id: 'notification-2', message: 'A player left the session' }),
        ]}
        on_dismiss={vi.fn()}
      />
    )

    expect(screen.getByText('Tile placed')).toBeInTheDocument()
    expect(screen.getByText('A player left the session')).toBeInTheDocument()
  })

  it('does not dismiss before 5 seconds', async () => {
    const on_dismiss = vi.fn()
    render(<NotificationCenter notifications={[make_notification()]} on_dismiss={on_dismiss} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999)
    })

    expect(screen.getByText('Tile placed')).toBeInTheDocument()
    expect(on_dismiss).not.toHaveBeenCalled()
  })

  it('calls on_dismiss with the notification id once its toast auto-dismisses after ~5 seconds', async () => {
    const on_dismiss = vi.fn()
    render(<NotificationCenter notifications={[make_notification({ id: 'notification-1' })]} on_dismiss={on_dismiss} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(on_dismiss).toHaveBeenCalledWith('notification-1')
    expect(screen.queryByText('Tile placed')).not.toBeInTheDocument()
  })

  it('dismisses each notification independently', async () => {
    const on_dismiss = vi.fn()
    render(
      <NotificationCenter
        notifications={[make_notification({ id: 'notification-1' }), make_notification({ id: 'notification-2', message: 'Second' })]}
        on_dismiss={on_dismiss}
      />
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(on_dismiss).toHaveBeenCalledTimes(2)
    expect(on_dismiss).toHaveBeenCalledWith('notification-1')
    expect(on_dismiss).toHaveBeenCalledWith('notification-2')
  })
})
