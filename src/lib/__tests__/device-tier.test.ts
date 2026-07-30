import { describe, it, expect } from 'vitest'
import { pickTier } from '@/lib/device-tier'

describe('pickTier', () => {
  it('gives high tier to capable machines', () => {
    expect(pickTier({ cores: 10, memoryGb: 16 })).toBe('high')
  })
  it('gives low tier to weak machines', () => {
    expect(pickTier({ cores: 2 })).toBe('low')
    expect(pickTier({ cores: 8, memoryGb: 2 })).toBe('low')
  })
  it('defaults to high when memory is unknown but cores suffice', () => {
    expect(pickTier({ cores: 6 })).toBe('high')
  })
})
