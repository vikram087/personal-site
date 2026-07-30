import { DESTINATIONS } from '@/config/destinations'

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ planet: d.slug }))
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params
  if (planet === 'education') return <div data-panel="education">Education panel (Task 11)</div>
  return null
}
