import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from './modal'

function ModalWithTrigger() {
  const [is_open, set_is_open] = useState(false)

  return (
    <div>
      <button onClick={() => set_is_open(true)}>Open modal</button>
      <Modal is_open={is_open} onClose={() => set_is_open(false)} title="Confirm">
        <button>First</button>
        <button>Second</button>
      </Modal>
    </div>
  )
}

describe('Modal', () => {
  it('renders nothing when is_open is false', () => {
    const { container } = render(
      <Modal is_open={false} onClose={vi.fn()}>
        Body content
      </Modal>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the title and children when is_open is true', () => {
    render(
      <Modal is_open title="Confirm" onClose={vi.fn()}>
        Body content
      </Modal>
    )

    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('calls onClose when the overlay is clicked', () => {
    const on_close = vi.fn()
    const { container } = render(
      <Modal is_open onClose={on_close}>
        Body content
      </Modal>
    )

    fireEvent.click(container.querySelector('.modal-overlay')!)

    expect(on_close).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside the sheet', () => {
    const on_close = vi.fn()
    render(
      <Modal is_open onClose={on_close}>
        Body content
      </Modal>
    )

    fireEvent.click(screen.getByText('Body content'))

    expect(on_close).not.toHaveBeenCalled()
  })

  it('has dialog semantics', () => {
    render(
      <Modal is_open title="Confirm" onClose={vi.fn()}>
        Body content
      </Modal>
    )

    const dialog_element = screen.getByRole('dialog')
    expect(dialog_element).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onClose when Escape is pressed', () => {
    const on_close = vi.fn()
    render(
      <Modal is_open onClose={on_close}>
        Body content
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(on_close).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the modal on open and restores it to the trigger on close', () => {
    render(<ModalWithTrigger />)

    const trigger_button = screen.getByText('Open modal')
    trigger_button.focus()
    expect(document.activeElement).toBe(trigger_button)

    fireEvent.click(trigger_button)
    expect(document.activeElement).toBe(screen.getByText('First'))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger_button)
  })

  it('traps Tab focus within the modal', () => {
    render(
      <Modal is_open onClose={vi.fn()}>
        <button>First</button>
        <button>Second</button>
      </Modal>
    )

    const first_button = screen.getByText('First')
    const second_button = screen.getByText('Second')

    second_button.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(first_button)

    first_button.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(second_button)
  })
})
