import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingScreen } from '@/components/hud/LoadingScreen'

describe('LoadingScreen', () => {
  it('renders the base transmission message without a percentage', () => {
    render(<LoadingScreen />)
    expect(screen.getByRole('status')).toHaveTextContent('Establishing transmission…')
    expect(screen.getByRole('status')).not.toHaveTextContent('%')
  })

  it('shows load progress as a rounded percentage when provided', () => {
    render(<LoadingScreen progress={42.4} />)
    expect(screen.getByRole('status')).toHaveTextContent('42%')
  })

  it('clamps progress to the 0–100 range', () => {
    render(<LoadingScreen progress={130} />)
    expect(screen.getByRole('status')).toHaveTextContent('100%')
  })

  it('fades out when done', () => {
    render(<LoadingScreen done />)
    expect(screen.getByRole('status')).toHaveClass('is-done')
  })

  it('is fully opaque while loading', () => {
    render(<LoadingScreen />)
    expect(screen.getByRole('status')).not.toHaveClass('is-done')
  })
})
