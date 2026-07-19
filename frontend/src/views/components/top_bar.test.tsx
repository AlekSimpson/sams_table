import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TopBar from './top_bar'

describe('TopBar', () => {
  it('renders the title', () => {
    render(<TopBar title="Combat Tracker" />)

    expect(screen.getByText('Combat Tracker')).toBeInTheDocument()
  })

  it('does not render a title element when title is omitted', () => {
    render(<TopBar left="Left slot" />)

    expect(screen.getByText('Left slot')).toBeInTheDocument()
    expect(screen.queryByText('Combat Tracker')).not.toBeInTheDocument()
  })

  it('renders left, center (children), and right slot content', () => {
    render(
      <TopBar left="Left slot" right="Right slot">
        Center slot
      </TopBar>
    )

    expect(screen.getByText('Left slot')).toBeInTheDocument()
    expect(screen.getByText('Center slot')).toBeInTheDocument()
    expect(screen.getByText('Right slot')).toBeInTheDocument()
  })

  it('merges an additional className onto the header element', () => {
    const { container } = render(<TopBar title="Combat Tracker" className="custom-class" />)

    expect(container.firstChild).toHaveClass('top-bar', 'custom-class')
  })
})
