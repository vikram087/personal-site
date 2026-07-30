import { DESTINATIONS, type DestinationDef, type CityDef } from '@/config/destinations'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter, hobbyFrontmatter } from '@/lib/content/schemas'
import { deriveTopics } from '@/lib/derive'
import { slugToLatLng } from '@/lib/geo'

export type CityNode = {
  slug: string
  name: string
  descriptor: string
  lat: number
  lng: number
  href: string
}

export type DestinationNode = Omit<DestinationDef, 'cities'> & { cityNodes: CityNode[] }

function staticCity(planetSlug: string, city: CityDef): CityNode {
  return { ...city, ...slugToLatLng(city.slug), href: `/${planetSlug}/${city.slug}` }
}

function hobbyCities(root?: string): CityNode[] {
  const hobbies: any = loadCollection('hobbies', hobbyFrontmatter as any, root)
  return hobbies.map((e: any) => ({
    slug: e.slug,
    name: e.frontmatter.title,
    descriptor: e.frontmatter.summary,
    ...(e.frontmatter.marker ?? slugToLatLng(e.slug)),
    href: `/hobbies/${e.slug}`,
  }))
}

function blogTopicCities(root?: string): CityNode[] {
  const posts: any = loadCollection('blog', blogFrontmatter as any, root)
  return deriveTopics(posts).map((topic: any) => ({
    slug: topic,
    name: topic,
    descriptor: `${posts.filter((p: any) => p.frontmatter.topic === topic).length} transmissions`,
    ...slugToLatLng(topic),
    href: `/blog/${topic}`,
  }))
}

export function buildSceneData(root?: string): DestinationNode[] {
  return DESTINATIONS.map(({ cities, ...rest }) => ({
    ...rest,
    cityNodes:
      cities === 'derived-hobbies'
        ? hobbyCities(root)
        : cities === 'derived-blog-topics'
          ? blogTopicCities(root)
          : cities.map((c) => staticCity(rest.slug, c)),
  }))
}
