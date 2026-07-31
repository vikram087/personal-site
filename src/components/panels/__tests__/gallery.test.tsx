import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Gallery } from '@/components/panels/Gallery'

describe('Gallery', () => {
  it('renders one img per image with alt text', () => {
    render(
      <Gallery
        images={[
          { src: '/photos/a.jpg', alt: 'First' },
          { src: '/photos/b.jpg', alt: 'Second' },
        ]}
      />,
    )
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
    expect(screen.getByAltText('First')).toHaveAttribute('src', '/photos/a.jpg')
  })
  it('renders nothing for an empty list', () => {
    const { container } = render(<Gallery images={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
