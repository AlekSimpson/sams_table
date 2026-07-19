// Shared component — top-right stack of auto-dismissing Toasts for session-wide events
// (dice rolls, HP/condition changes, player presence, tile placements). Presentational:
// the caller (see notification_viewmodel.ts) supplies the current notifications and a
// dismiss callback; this reuses the Toast primitive for each entry rather than
// reinventing toast styling.
import Toast from './toast'
import { SessionNotification } from '../../types/app_types'
import './notification_center.css'

const NOTIFICATION_DURATION_MILLISECONDS = 5000

interface NotificationCenterProps {
  notifications: SessionNotification[]
  on_dismiss: (id: string) => void
}

export default function NotificationCenter({ notifications, on_dismiss }: NotificationCenterProps) {
  if (notifications.length === 0) return null

  return (
    <div className="notification-center">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          message={notification.message}
          variant={notification.variant}
          duration_milliseconds={NOTIFICATION_DURATION_MILLISECONDS}
          on_dismiss={() => on_dismiss(notification.id)}
        />
      ))}
    </div>
  )
}
