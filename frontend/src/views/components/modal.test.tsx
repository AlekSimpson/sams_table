import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from './modal'

afterEach(() => {
  cleanup()
})

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
})
