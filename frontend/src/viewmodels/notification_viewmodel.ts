// VIEWMODEL layer — notification-center state. The only notification-related import
// Views need. Notifications themselves are added by dispatch_websocket_event (see
// util/websockets.ts), which writes to notification_model directly, same as other
// WS-driven store updates (e.g. combat_model's dice roll history) — this viewmodel's
// job is just to expose the current stack and a dismiss callback to the view.
import { notification_model } from '../models/notification_model'

export function notification_viewmodel() {
  const { notifications, remove_notification } = notification_model()

  return { notifications, remove_notification }
}
