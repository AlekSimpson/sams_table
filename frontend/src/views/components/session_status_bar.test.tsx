import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SessionStatusBar from './session_status_bar'

describe('SessionStatusBar', () => {
  describe('status dot', () => {
    it('renders an inactive dot labeled "Not in session" when not in session', () => {
      render(
        <SessionStatusBar
          role="dm"
          is_in_session={false}
          dm_props={{ join_code: '', copied: false, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
        />
      )

      const status_dot = screen.getByRole('status', { name: 'Not in session' })
      expect(status_dot).toHaveClass('session-status-bar__dot')
      expect(status_dot).not.toHaveClass('session-status-bar__dot--active')
    })

    it('renders an active dot labeled "In session" when in session', () => {
      render(
        <SessionStatusBar
          role="dm"
          is_in_session
          dm_props={{ join_code: 'ABCD', copied: false, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
        />
      )

      expect(screen.getByRole('status', { name: 'In session' })).toHaveClass('session-status-bar__dot--active')
    })
  })

  describe('dm role', () => {
    it('does not render join code controls when not in session', () => {
      render(
        <SessionStatusBar
          role="dm"
          is_in_session={false}
          dm_props={{ join_code: 'ABCD', copied: false, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
        />
      )

      expect(screen.queryByText('ABCD')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'End Session' })).not.toBeInTheDocument()
    })

    it('renders the join code, copy button, and end session button when in session', () => {
      render(
        <SessionStatusBar
          role="dm"
          is_in_session
          dm_props={{ join_code: 'ABCD', copied: false, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
        />
      )

      expect(screen.getByText('ABCD')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument()
    })

    it('shows "Copied!" instead of "Copy" once copied is true', () => {
      render(
        <SessionStatusBar
          role="dm"
          is_in_session
          dm_props={{ join_code: 'ABCD', copied: true, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
        />
      )

      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
    })

    it('calls on_copy_press when the copy button is clicked', () => {
      const on_copy_press = vi.fn()
      render(
        <SessionStatusBar
          role="dm"
          is_in_session
          dm_props={{ join_code: 'ABCD', copied: false, on_copy_press, on_end_session_press: vi.fn() }}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

      expect(on_copy_press).toHaveBeenCalledTimes(1)
    })

    it('calls on_end_session_press when the end session button is clicked', () => {
      const on_end_session_press = vi.fn()
      render(
        <SessionStatusBar
          role="dm"
          is_in_session
          dm_props={{ join_code: 'ABCD', copied: false, on_copy_press: vi.fn(), on_end_session_press }}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'End Session' }))

      expect(on_end_session_press).toHaveBeenCalledTimes(1)
    })
  })

  describe('player role', () => {
    const base_player_props = {
      join_code_draft: '',
      on_join_code_change: vi.fn(),
      on_join_code_key_down: vi.fn(),
      on_join_press: vi.fn(),
      is_joining: false,
      join_error: null,
      on_live_map_press: vi.fn(),
    }

    it('renders the join code input and a disabled join button when the draft is empty', () => {
      render(<SessionStatusBar role="player" is_in_session={false} player_props={base_player_props} />)

      expect(screen.getByPlaceholderText('Join Code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled()
    })

    it('enables the join button once the draft is non-empty and calls on_join_press when clicked', () => {
      const on_join_press = vi.fn()
      render(
        <SessionStatusBar
          role="player"
          is_in_session={false}
          player_props={{ ...base_player_props, join_code_draft: 'ABCD', on_join_press }}
        />
      )

      const join_button = screen.getByRole('button', { name: 'Join' })
      expect(join_button).not.toBeDisabled()

      fireEvent.click(join_button)

      expect(on_join_press).toHaveBeenCalledTimes(1)
    })

    it('shows "Joining…" and disables the input and join button while is_joining is true', () => {
      render(
        <SessionStatusBar
          role="player"
          is_in_session={false}
          player_props={{ ...base_player_props, join_code_draft: 'ABCD', is_joining: true }}
        />
      )

      expect(screen.getByRole('button', { name: 'Joining…' })).toBeDisabled()
      expect(screen.getByPlaceholderText('Join Code')).toBeDisabled()
    })

    it('renders the join error when present', () => {
      render(
        <SessionStatusBar
          role="player"
          is_in_session={false}
          player_props={{ ...base_player_props, join_error: 'Invalid join code' }}
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid join code')
    })

    it('calls on_live_map_press when the Live Map button is clicked', () => {
      const on_live_map_press = vi.fn()
      render(
        <SessionStatusBar
          role="player"
          is_in_session={false}
          player_props={{ ...base_player_props, on_live_map_press }}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Live Map' }))

      expect(on_live_map_press).toHaveBeenCalledTimes(1)
    })
  })

  it('does not render a notification bell button', () => {
    render(
      <SessionStatusBar
        role="dm"
        is_in_session
        dm_props={{ join_code: 'ABCD', copied: false, on_copy_press: vi.fn(), on_end_session_press: vi.fn() }}
      />
    )

    expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument()
    expect(screen.queryByText('🔔')).not.toBeInTheDocument()
  })
})
