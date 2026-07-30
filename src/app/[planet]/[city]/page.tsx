import { buildSceneData } from '@/lib/content/scene-data'
import { EntryListPanel } from '@/components/panels/EntryListPanel'
import { HobbyPanel } from '@/components/panels/HobbyPanel'
import { BlogTopicPanel } from '@/components/panels/BlogTopicPanel'
import { ComingSoonPanel } from '@/components/hud/ComingSoonPanel'

export function generateStaticParams() {
  return buildSceneData()
    .filter((d) => d.slug !== 'education')
    .flatMap((d) => d.cityNodes.map((c) => ({ planet: d.slug, city: c.slug })))
}

export default async function CityPage({ params }: { params: Promise<{ planet: string; city: string }> }) {
  const { planet, city } = await params
  if (planet === 'professional') return <EntryListPanel city={city as 'work' | 'ventures' | 'projects'} />
  if (planet === 'hobbies') return <HobbyPanel slug={city} />
  if (planet === 'blog') return <BlogTopicPanel topic={city} />
  if (planet === 'tower') return <ComingSoonPanel />
  return null
}
