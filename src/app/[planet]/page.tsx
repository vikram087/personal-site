import { DESTINATIONS } from '@/config/destinations'
import { EducationPanel } from '@/components/panels/EducationPanel'

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ planet: d.slug }))
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params
  if (planet === 'education') return <EducationPanel />
  return null
}
