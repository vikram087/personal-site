import { describe, it, expect } from 'vitest'
import { DESTINATIONS, PLANET_SLUGS } from '@/config/destinations'

describe('DESTINATIONS', () => {
  it('contains the five destinations from the spec', () => {
    expect(PLANET_SLUGS).toEqual(['education', 'professional', 'hobbies', 'blog', 'tower'])
  })
  it('has unique slugs and positions', () => {
    const slugs = DESTINATIONS.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const positions = DESTINATIONS.map((d) => d.position.join(','))
    expect(new Set(positions).size).toBe(positions.length)
  })
  it('uses valid hex accents', () => {
    for (const d of DESTINATIONS) expect(d.accent).toMatch(/^#[0-9A-F]{6}$/i)
  })
  it('marks education as auto-open with no cities', () => {
    const edu = DESTINATIONS.find((d) => d.slug === 'education')
    expect(edu?.autoOpenPanel).toBe(true)
    expect(edu?.cities).toEqual([])
  })
  it('marks the tower as a station with the feed city', () => {
    const tower = DESTINATIONS.find((d) => d.slug === 'tower')
    expect(tower?.kind).toBe('station')
    expect(tower?.cities).toEqual([
      { slug: 'feed', name: 'Live Feed', descriptor: 'Transmission offline — coming soon' },
    ])
  })
})
