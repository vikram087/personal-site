import { describe, it, expect } from 'vitest'
import { slugToLatLng, latLngToVector3 } from '@/lib/geo'

describe('slugToLatLng', () => {
  it('is deterministic', () => {
    expect(slugToLatLng('tennis')).toEqual(slugToLatLng('tennis'))
  })
  it('differs across slugs', () => {
    expect(slugToLatLng('tennis')).not.toEqual(slugToLatLng('skiing'))
  })
  it('stays within visible bounds', () => {
    for (const slug of ['a', 'work', 'ventures', 'projects', 'long-slug-name']) {
      const { lat, lng } = slugToLatLng(slug)
      expect(lat).toBeGreaterThanOrEqual(-50)
      expect(lat).toBeLessThanOrEqual(50)
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThan(180)
    }
  })
})

describe('latLngToVector3', () => {
  it('maps the north pole to +Y', () => {
    const [x, y, z] = latLngToVector3(90, 0, 2)
    expect(x).toBeCloseTo(0, 5)
    expect(y).toBeCloseTo(2, 5)
    expect(z).toBeCloseTo(0, 5)
  })
  it('keeps points on the sphere surface', () => {
    const [x, y, z] = latLngToVector3(33, -120, 3)
    expect(Math.hypot(x, y, z)).toBeCloseTo(3, 5)
  })
})
