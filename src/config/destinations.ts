export type CityDef = { slug: string; name: string; descriptor: string }

/** Visual personality for a destination. Textures are baked per-slug by scripts/generate-planet-textures.mjs. */
export type DestinationLook = {
  /** fbm noise frequency — kept for the texture baker's reference */
  bands: number
  /** surface/cloud animation speed multiplier */
  flow: number
  /** night-side city-grid glow (Professional) */
  grid?: boolean
  /** travelling signal-wave emissive (Blog) */
  pulse?: boolean
  /** orbiting gyroscope rings (Education) */
  ring?: boolean
  /** emissive map strength at night (default 1) */
  emissive?: number
  /** cloud layer opacity 0–1 (default 0 = no clouds) */
  clouds?: number
}

export type DestinationDef = {
  slug: string
  name: string
  descriptor: string
  kind: 'planet' | 'station'
  accent: string
  position: [number, number, number]
  cities: CityDef[] | 'derived-hobbies' | 'derived-blog-topics'
  autoOpenPanel?: boolean
  look?: DestinationLook
}

export const DESTINATIONS: DestinationDef[] = [
  {
    slug: 'education',
    name: 'Education',
    descriptor: 'Degrees and certifications',
    kind: 'planet',
    accent: '#5B9DFF',
    position: [-7, 2, -4],
    cities: [],
    autoOpenPanel: true,
    look: { bands: 2.6, flow: 0.35, ring: true, emissive: 0.8, clouds: 0.38 },
  },
  {
    slug: 'professional',
    name: 'Professional',
    descriptor: 'Work, ventures, projects',
    kind: 'planet',
    accent: '#F5A83C',
    position: [5, 1, -8],
    cities: [
      { slug: 'work', name: 'Work', descriptor: 'Roles and employers' },
      { slug: 'ventures', name: 'Personal Ventures', descriptor: 'Things I have started' },
      { slug: 'projects', name: 'Projects', descriptor: 'Built for the joy of it' },
    ],
    look: { bands: 2.1, flow: 0.2, grid: true, emissive: 2.6, clouds: 0.24 },
  },
  {
    slug: 'hobbies',
    name: 'Hobbies',
    descriptor: 'Sports and pursuits',
    kind: 'planet',
    accent: '#35E0B2',
    position: [-2, -3, -11],
    cities: 'derived-hobbies',
    look: { bands: 4.2, flow: 1.0, emissive: 0.7, clouds: 0.5 },
  },
  {
    slug: 'blog',
    name: 'Blog',
    descriptor: 'Writing, by topic',
    kind: 'planet',
    accent: '#9F6BFF',
    position: [7.2, -2.8, -1.5],
    cities: 'derived-blog-topics',
    look: { bands: 2.9, flow: 0.5, pulse: true, emissive: 1.5, clouds: 0.16 },
  },
  {
    slug: 'tower',
    name: 'The Tower',
    descriptor: 'Home base',
    kind: 'station',
    accent: '#C9D4E4',
    position: [1, 4, -6],
    cities: [{ slug: 'feed', name: 'Live Feed', descriptor: 'Transmission offline — coming soon' }],
  },
]

export const PLANET_SLUGS = DESTINATIONS.map((d) => d.slug)

export function accentOf(slug: string): string {
  const destination = DESTINATIONS.find((d) => d.slug === slug)
  if (!destination) throw new Error(`Unknown destination slug: ${slug}`)
  return destination.accent
}
