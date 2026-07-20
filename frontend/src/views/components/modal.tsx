// Shared component — centered overlay modal/sheet.
import { MouseEvent, ReactNode, useEffect, useRef } from 'react'
import './modal.css'

interface ModalProps {
  is_open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}

const FOCUSABLE_ELEMENTS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ is_open, onClose, title, children }: ModalProps) {
  const sheet_reference = useRef<HTMLDivElement>(null)
  const previously_focused_element_reference = useRef<HTMLElement | null>(null)

  // Move focus into the sheet on open, restore it to the trigger element on close.
  useEffect(() => {
    if (!is_open) return

    previously_focused_element_reference.current = document.activeElement as HTMLElement | null

    const focusable_elements = sheet_reference.current?.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
    const first_focusable_element = focusable_elements?.[0]
    ;(first_focusable_element ?? sheet_reference.current)?.focus()

    return () => {
      previously_focused_element_reference.current?.focus()
    }
  }, [is_open])

  // Close on Escape, and trap Tab/Shift+Tab cycling within the sheet.
  useEffect(() => {
    if (!is_open) return

    const on_document_key_down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable_elements = sheet_reference.current?.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
      if (!focusable_elements || focusable_elements.length === 0) {
        event.preventDefault()
        return
      }

      const first_focusable_element = focusable_elements[0]
      const last_focusable_element = focusable_elements[focusable_elements.length - 1]

      if (event.shiftKey && document.activeElement === first_focusable_element) {
        event.preventDefault()
        last_focusable_element.focus()
      } else if (!event.shiftKey && document.activeElement === last_focusable_element) {
        event.preventDefault()
        first_focusable_element.focus()
      }
    }

    document.addEventListener('keydown', on_document_key_down)
    return () => document.removeEventListener('keydown', on_document_key_down)
  }, [is_open, onClose])

  if (!is_open) return null

  const on_sheet_click = (event: MouseEvent) => event.stopPropagation()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={sheet_reference}
        onClick={on_sheet_click}
      >
        {title && <div className="modal-sheet__header">{title}</div>}
        <div className="modal-sheet__body">{children}</div>
      </div>
    </div>
  )
}
