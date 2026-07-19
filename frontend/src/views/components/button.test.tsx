import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from './button'

describe('Button', () => {
  it('renders its children as the button label', () => {
    render(<Button>Save Character</Button>)

    expect(screen.getByRole('button', { name: 'Save Character' })).toBeInTheDocument()
  })

  it('defaults to the primary variant and default size, with no small class', () => {
    render(<Button>Save</Button>)

    const button_element = screen.getByRole('button', { name: 'Save' })
    expect(button_element).toHaveClass('button', 'button--primary')
    expect(button_element).not.toHaveClass('button--small')
  })

  it.each([
    ['secondary', 'button--secondary'],
    ['destructive', 'button--destructive'],
    ['ghost', 'button--ghost'],
  ] as const)('applies the %s variant class', (variant, expected_class) => {
    render(<Button variant={variant}>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(expected_class)
  })

  it('applies the small size class when size is small', () => {
    render(<Button size="small">Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('button--small')
  })

  it('applies the full-width class when full_width is true', () => {
    render(<Button full_width>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('button--full-width')
  })

  it('calls onClick when clicked', () => {
    const on_click = vi.fn()
    render(<Button onClick={on_click}>Save</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(on_click).toHaveBeenCalledTimes(1)
  })

  it('disables the button and does not fire onClick when disabled', () => {
    const on_click = vi.fn()
    render(
      <Button disabled onClick={on_click}>
        Save
      </Button>
    )

    const button_element = screen.getByRole('button', { name: 'Save' })
    expect(button_element).toBeDisabled()

    fireEvent.click(button_element)

    expect(on_click).not.toHaveBeenCalled()
  })
})
