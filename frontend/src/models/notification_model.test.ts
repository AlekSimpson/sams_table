import { describe, expect, it, beforeEach } from 'vitest'
import { notification_model } from './notification_model'

describe('notification_model', () => {
  beforeEach(() => {
    notification_model.setState({ notifications: [] })
  })

  describe('add_notification', () => {
    it('appends a notification with the given message/variant, a generated id, and a created_at timestamp', () => {
      notification_model.getState().add_notification('Tile placed', 'success')

      const notifications = notification_model.getState().notifications
      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toMatchObject({ message: 'Tile placed', variant: 'success' })
      expect(notifications[0].id).toEqual(expect.any(String))
      expect(notifications[0].created_at).toEqual(expect.any(Number))
    })

    it('stacks multiple notifications instead of replacing the previous one', () => {
      notification_model.getState().add_notification('First', 'info')
      notification_model.getState().add_notification('Second', 'success')

      expect(notification_model.getState().notifications.map((notification) => notification.message)).toEqual([
        'First',
        'Second',
      ])
    })

    it('gives each notification a unique id', () => {
      notification_model.getState().add_notification('First', 'info')
      notification_model.getState().add_notification('Second', 'info')

      const [first, second] = notification_model.getState().notifications
      expect(first.id).not.toBe(second.id)
    })
  })

  describe('remove_notification', () => {
    it('removes the notification with the given id', () => {
      notification_model.getState().add_notification('First', 'info')
      const id_to_remove = notification_model.getState().notifications[0].id
      notification_model.getState().add_notification('Second', 'info')

      notification_model.getState().remove_notification(id_to_remove)

      expect(notification_model.getState().notifications.map((notification) => notification.message)).toEqual([
        'Second',
      ])
    })

    it('is a no-op when the id does not match any notification', () => {
      notification_model.getState().add_notification('First', 'info')

      notification_model.getState().remove_notification('nonexistent-id')

      expect(notification_model.getState().notifications).toHaveLength(1)
    })
  })
})
