export type CityDef = { slug: string; name: string; descriptor: string }

export type DestinationDef = {
  slug: string
  name: string
  descriptor: string
  kind: 'planet' | 'station'
  accent: string
  position: [number, number, number]
  cities: CityDef[] | 'derived-hobbies' | 'derived-blog-topics'
  autoOpenPanel?: boolean
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
  },
  {
    slug: 'hobbies',
    name: 'Hobbies',
    descriptor: 'Sports and pursuits',
    kind: 'planet',
    accent: '#35E0B2',
    position: [-2, -3, -11],
    cities: 'derived-hobbies',
  },
  {
    slug: 'blog',
    name: 'Blog',
    descriptor: 'Writing, by topic',
    kind: 'planet',
    accent: '#9F6BFF',
    position: [9, -2, -2],
    cities: 'derived-blog-topics',
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
