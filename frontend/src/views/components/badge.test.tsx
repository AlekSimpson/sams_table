import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Badge from './badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Poisoned</Badge>)

    expect(screen.getByText('Poisoned')).toBeInTheDocument()
  })

  it('defaults to the neutral variant class', () => {
    render(<Badge>Poisoned</Badge>)

    expect(screen.getByText('Poisoned')).toHaveClass('badge', 'badge--neutral')
  })

  it.each([
    ['danger', 'badge--danger'],
    ['success', 'badge--success'],
    ['warning', 'badge--warning'],
    ['info', 'badge--info'],
  ] as const)('applies the %s variant class', (variant, expected_class) => {
    render(<Badge variant={variant}>Poisoned</Badge>)

    expect(screen.getByText('Poisoned')).toHaveClass(expected_class)
  })
})
