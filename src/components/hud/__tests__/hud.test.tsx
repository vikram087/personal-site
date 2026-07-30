import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HudChrome } from '@/components/hud/HudChrome'

const props = {
  about: <p>About body</p>,
  now: <p>Now body</p>,
  uses: <p>Uses body</p>,
  contact: <p>Contact body</p>,
}

describe('HudChrome', () => {
  it('opens the About panel with tabs and switches to Now', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /vikram/i }))
    expect(screen.getByText('About body')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Now' }))
    expect(screen.getByText('Now body')).toBeInTheDocument()
  })
  it('opens Contact from the transmission button', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /contact/i }))
    expect(screen.getByText('Contact body')).toBeInTheDocument()
  })
  it('links to the destinations index', () => {
    render(<HudChrome {...props} />)
    expect(screen.getByRole('link', { name: /index/i })).toHaveAttribute('href', '/destinations')
  })
})
