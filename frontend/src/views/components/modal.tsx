// Shared component — centered overlay modal/sheet.
import { MouseEvent, ReactNode } from 'react'
import './modal.css'

interface ModalProps {
  is_open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}

export default function Modal({ is_open, onClose, title, children }: ModalProps) {
  if (!is_open) return null

  const on_sheet_click = (event: MouseEvent) => event.stopPropagation()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={on_sheet_click}>
        {title && <div className="modal-sheet__header">{title}</div>}
        <div className="modal-sheet__body">{children}</div>
      </div>
    </div>
  )
}
