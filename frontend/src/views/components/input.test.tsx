import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Input from './input'

afterEach(() => {
  cleanup()
})

describe('Input', () => {
  it('renders a bare input with no label wrapper when label is omitted', () => {
    const { container } = render(<Input placeholder="Character name" />)

    expect(screen.getByPlaceholderText('Character name')).toBeInTheDocument()
    expect(container.querySelector('label')).not.toBeInTheDocument()
  })

  it('renders a label associated with the input via htmlFor/id', () => {
    render(<Input id="character-name" label="Character Name" />)

    const input_element = screen.getByLabelText('Character Name')
    expect(input_element.tagName).toBe('INPUT')
  })

  it('calls onChange with the typed value', () => {
    const on_change = vi.fn()
    render(<Input id="character-name" label="Character Name" onChange={on_change} />)

    fireEvent.change(screen.getByLabelText('Character Name'), { target: { value: 'Thorian' } })

    expect(on_change).toHaveBeenCalledTimes(1)
    expect((on_change.mock.calls[0][0] as React.ChangeEvent<HTMLInputElement>).target.value).toBe('Thorian')
  })
})
