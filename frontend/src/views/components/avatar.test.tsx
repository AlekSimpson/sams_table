import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Avatar from './avatar'

describe('Avatar', () => {
  it('renders the label', () => {
    render(<Avatar label="TA" />)

    expect(screen.getByText('TA')).toBeInTheDocument()
  })

  it('defaults to the medium size class', () => {
    const { container } = render(<Avatar label="TA" />)

    expect(container.firstChild).toHaveClass('avatar', 'avatar--medium')
  })

  it.each([
    ['small', 'avatar--small'],
    ['large', 'avatar--large'],
  ] as const)('applies the %s size class', (size, expected_class) => {
    const { container } = render(<Avatar label="TA" size={size} />)

    expect(container.firstChild).toHaveClass(expected_class)
  })

  it('renders an optional corner badge', () => {
    render(<Avatar label="TA" badge={5} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not render a badge element when badge is omitted', () => {
    const { container } = render(<Avatar label="TA" />)

    expect(container.querySelector('.avatar__badge')).not.toBeInTheDocument()
  })
})
