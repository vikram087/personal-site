import { buildSceneData } from '@/lib/content/scene-data'

export function generateStaticParams() {
  return buildSceneData()
    .filter((d) => d.slug !== 'education')
    .flatMap((d) => d.cityNodes.map((c) => ({ planet: d.slug, city: c.slug })))
}

export default async function CityPage({ params }: { params: Promise<{ planet: string; city: string }> }) {
  const { planet, city } = await params
  return <div data-panel={`${planet}/${city}`}>City panel (Task 11)</div>
}
