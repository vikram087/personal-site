import { describe, it, expect } from 'vitest'
import { shadeHex } from '@/lib/color'

describe('shadeHex', () => {
  it('returns the same color for factor 1', () => {
    expect(shadeHex('#5B9DFF', 1)).toBe('#5b9dff')
  })
  it('darkens with factor < 1', () => {
    expect(shadeHex('#ffffff', 0.5)).toBe('#808080')
  })
  it('lightens and clamps with factor > 1', () => {
    expect(shadeHex('#808080', 2)).toBe('#ffffff')
    expect(shadeHex('#ffffff', 2)).toBe('#ffffff')
  })
  it('clamps to black at factor 0', () => {
    expect(shadeHex('#5B9DFF', 0)).toBe('#000000')
  })
  it('rejects malformed input', () => {
    expect(() => shadeHex('5B9DFF', 1)).toThrow()
    expect(() => shadeHex('#fff', 1)).toThrow()
  })
})
