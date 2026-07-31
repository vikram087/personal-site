import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HudChrome } from '@/components/hud/HudChrome'

const props = {
  about: <p>About body</p>,
  contact: <p>Contact body</p>,
}

describe('HudChrome', () => {
  it('opens the About panel from the name button', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /vikram/i }))
    expect(screen.getByText('About body')).toBeInTheDocument()
  })
  it('opens Contact from the transmission button', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /contact/i }))
    expect(screen.getByText('Contact body')).toBeInTheDocument()
  })
})
