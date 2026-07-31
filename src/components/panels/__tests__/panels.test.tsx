import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Panel } from '@/components/hud/Panel'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: () => ({ push }),
  usePathname: () => '/professional/work',
}))

describe('Panel', () => {
  beforeEach(() => push.mockClear())

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

  it('does not render a back link', () => {
    render(
      <Panel accent="#F5A83C" kicker="k" title="t">
        <p>x</p>
      </Panel>,
    )
    expect(screen.queryByRole('link', { name: '← Back' })).not.toBeInTheDocument()
  })

  it('close button navigates one route level up by default', () => {
    render(
      <Panel accent="#F5A83C" kicker="k" title="Work">
        <p>x</p>
      </Panel>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close Work' }))
    expect(push).toHaveBeenCalledWith('/professional')
  })

  it('close button uses the onClose override when provided', () => {
    const onClose = vi.fn()
    render(
      <Panel accent="#F5A83C" kicker="k" title="About" onClose={onClose}>
        <p>x</p>
      </Panel>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close About' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
  })
})
