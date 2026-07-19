// Shared component — ephemeral confirmation message that auto-dismisses itself.
// Callers force a fresh appearance for repeated events (e.g. placing several tiles
// in a row) by remounting via a changing `key` prop.
import { useEffect, useState } from 'react'
import './toast.css'

export type ToastVariant = 'success' | 'danger' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant
  duration_milliseconds?: number
}

export default function Toast({ message, variant = 'success', duration_milliseconds = 2500 }: ToastProps) {
  const [is_dismissed, set_is_dismissed] = useState(false)

  useEffect(() => {
    const dismiss_timeout = setTimeout(() => set_is_dismissed(true), duration_milliseconds)
    return () => clearTimeout(dismiss_timeout)
  }, [duration_milliseconds])

  if (is_dismissed) return null

  return (
    <div className={`toast toast--${variant}`} role="status">
      {message}
    </div>
  )
}
