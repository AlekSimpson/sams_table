import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ConditionBadge from './condition_badge'

afterEach(() => {
  cleanup()
})

describe('ConditionBadge', () => {
  it('renders the condition text', () => {
    render(<ConditionBadge condition="Poisoned" />)

    expect(screen.getByText('Poisoned')).toBeInTheDocument()
  })

  it('renders using the danger badge variant', () => {
    render(<ConditionBadge condition="Poisoned" />)

    expect(screen.getByText('Poisoned')).toHaveClass('badge--danger')
  })
})
