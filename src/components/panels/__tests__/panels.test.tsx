import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel } from '@/components/hud/Panel'

vi.mock('next/navigation', () => ({ notFound: vi.fn() }))

describe('Panel', () => {
  it('renders kicker, title, and body content', () => {
    render(
      <Panel accent="#F5A83C" kicker="Professional · Work" title="Work">
        <p>Body text</p>
      </Panel>,
    )
    expect(screen.getByText('Professional · Work')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Work' })).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })
  it('renders a back link when backHref is given', () => {
    render(
      <Panel accent="#F5A83C" kicker="k" title="t" backHref="/professional">
        <p>x</p>
      </Panel>,
    )
    expect(screen.getByRole('link', { name: '← Back' })).toHaveAttribute('href', '/professional')
  })
})
