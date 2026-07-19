// Shared component — ephemeral confirmation message that auto-dismisses itself.
// Callers force a fresh appearance for repeated events (e.g. placing several tiles
// in a row) by remounting via a changing `key` prop.
import { useEffect, useState } from 'react'
import { ToastVariant } from '../../types/app_types'
import './toast.css'

export type { ToastVariant }

interface ToastProps {
  message: string
  variant?: ToastVariant
  duration_milliseconds?: number
  /** Called once the toast auto-dismisses (e.g. so a caller can drop it from a list). */
  on_dismiss?: () => void
}

export default function Toast({ message, variant = 'success', duration_milliseconds = 2500, on_dismiss }: ToastProps) {
  const [is_dismissed, set_is_dismissed] = useState(false)

  useEffect(() => {
    const dismiss_timeout = setTimeout(() => {
      set_is_dismissed(true)
      on_dismiss?.()
    }, duration_milliseconds)
    return () => clearTimeout(dismiss_timeout)
  }, [duration_milliseconds])

  if (is_dismissed) return null

  return (
    <div className={`toast toast--${variant}`} role="status">
      {message}
    </div>
  )
}
