// Shared component — role-aware top-bar session chrome: status dot, join-code UI
// (DM display/copy/end-session vs. player entry form), Live Map and Combat buttons
// (player only), and a notification icon slot (functionality lands in a later ticket —
// this is the visual placeholder only).
import { ChangeEvent, KeyboardEvent } from 'react'
import Badge from './badge'
import Button from './button'
import Input from './input'
import './session_status_bar.css'

interface DmJoinCodeProps {
  join_code: string
  copied: boolean
  on_copy_press: () => void
  on_end_session_press: () => void
}

interface PlayerJoinCodeProps {
  join_code_draft: string
  on_join_code_change: (event: ChangeEvent<HTMLInputElement>) => void
  on_join_code_key_down: (event: KeyboardEvent<HTMLInputElement>) => void
  on_join_press: () => void
  is_joining: boolean
  join_error: string | null
  on_live_map_press: () => void
  on_combat_press: () => void
}

type SessionStatusBarProps =
  | { role: 'dm'; is_in_session: boolean; dm_props: DmJoinCodeProps }
  | { role: 'player'; is_in_session: boolean; player_props: PlayerJoinCodeProps }

export default function SessionStatusBar(props: SessionStatusBarProps) {
  const { role, is_in_session } = props
  const dot_classes = [
    'session-status-bar__dot',
    is_in_session ? 'session-status-bar__dot--active' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="session-status-bar">
      <span
        className={dot_classes}
        role="status"
        aria-label={is_in_session ? 'In session' : 'Not in session'}
      />

      {role === 'dm' && is_in_session && (
        <>
          <span className="section-label">Join Code</span>
          <Badge variant="info">{props.dm_props.join_code}</Badge>
          <Button variant="ghost" size="small" onClick={props.dm_props.on_copy_press}>
            {props.dm_props.copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="destructive" size="small" onClick={props.dm_props.on_end_session_press}>
            End Session
          </Button>
        </>
      )}

      {role === 'player' && (
        <>
          <div className="session-status-bar__join-code">
            <Input
              className="session-status-bar__join-code-input"
              placeholder="Join Code"
              value={props.player_props.join_code_draft}
              onChange={props.player_props.on_join_code_change}
              onKeyDown={props.player_props.on_join_code_key_down}
              disabled={props.player_props.is_joining}
            />
            <Button
              variant="secondary"
              size="small"
              onClick={props.player_props.on_join_press}
              disabled={props.player_props.is_joining || !props.player_props.join_code_draft.trim()}
            >
              {props.player_props.is_joining ? 'Joining…' : 'Join'}
            </Button>
            {props.player_props.join_error && (
              <span className="session-status-bar__join-error" role="alert">
                {props.player_props.join_error}
              </span>
            )}
          </div>
          <Button variant="ghost" size="small" onClick={props.player_props.on_live_map_press}>
            Live Map
          </Button>
          <Button variant="ghost" size="small" onClick={props.player_props.on_combat_press}>
            Combat
          </Button>
        </>
      )}

      <Button variant="ghost" size="small" aria-label="Notifications">
        🔔
      </Button>
    </div>
  )
}
