import { describe, it, expect } from 'vitest'
import { slugToLatLng, latLngToVector3, frontHemisphereLng } from '@/lib/geo'

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

describe('frontHemisphereLng', () => {
  it('centers a single marker on the camera-facing meridian', () => {
    expect(frontHemisphereLng(0, 1)).toBe(-90)
  })
  it('spreads three markers evenly around the center', () => {
    expect([0, 1, 2].map((i) => frontHemisphereLng(i, 3))).toEqual([-135, -90, -45])
  })
  it('keeps every marker on the camera-facing hemisphere', () => {
    for (let count = 1; count <= 8; count += 1) {
      for (let i = 0; i < count; i += 1) {
        const lng = frontHemisphereLng(i, count)
        expect(lng).toBeGreaterThan(-180)
        expect(lng).toBeLessThan(0)
      }
    }
  })
  it('produces camera-facing 3D positions (positive z)', () => {
    for (const i of [0, 1, 2, 3]) {
      const [, , z] = latLngToVector3(20, frontHemisphereLng(i, 4), 1.45)
      expect(z).toBeGreaterThan(0)
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
