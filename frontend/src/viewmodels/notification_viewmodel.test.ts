import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { notification_model } from '../models/notification_model'
import { notification_viewmodel } from './notification_viewmodel'

describe('notification_viewmodel', () => {
  beforeEach(() => {
    notification_model.setState({ notifications: [] })
  })

  it('exposes the current notifications from the store', () => {
    notification_model.getState().add_notification('Tile placed', 'success')

    const { result } = renderHook(() => notification_viewmodel())

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]).toMatchObject({ message: 'Tile placed', variant: 'success' })
  })

  it('remove_notification removes the notification from the store', () => {
    notification_model.getState().add_notification('Tile placed', 'success')
    const notification_id = notification_model.getState().notifications[0].id
    const { result } = renderHook(() => notification_viewmodel())

    act(() => {
      result.current.remove_notification(notification_id)
    })

    expect(notification_model.getState().notifications).toEqual([])
  })
})
