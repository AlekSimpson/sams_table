// MODEL layer — raw notification-center state (transient toast stack for session events).
// Views must not import this directly; use notification_viewmodel instead.
import { create } from 'zustand'
import { SessionNotification, ToastVariant } from '../types/app_types'

interface NotificationState {
  notifications: SessionNotification[]
}

interface NotificationActions {
  add_notification: (message: string, variant: ToastVariant) => void
  remove_notification: (id: string) => void
}

type NotificationModel = NotificationState & NotificationActions

export const notification_model = create<NotificationModel>()((set) => ({
  notifications: [],

  add_notification: (message, variant) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: crypto.randomUUID(), message, variant, created_at: Date.now() },
      ],
    })),

  remove_notification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),
}))
