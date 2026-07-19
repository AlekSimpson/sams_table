import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Panel from './panel'

describe('Panel', () => {
  it('renders its children with the base panel class', () => {
    const { container } = render(<Panel>Notes</Panel>)

    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('panel')
  })

  it('merges an additional className', () => {
    const { container } = render(<Panel className="custom-class">Notes</Panel>)

    expect(container.firstChild).toHaveClass('panel', 'custom-class')
  })
})
