import type { Metadata } from 'next'
import { DESTINATIONS } from '@/config/destinations'
import { EducationPanel } from '@/components/panels/EducationPanel'
import { SITE_METADATA } from '@/config/site-metadata'

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ planet: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planet: string }>
}): Promise<Metadata> {
  const { planet } = await params
  const destination = DESTINATIONS.find((d) => d.slug === planet)
  if (!destination) return SITE_METADATA
  return {
    title: `${destination.name} — Vikram Penumarti`,
    description: destination.descriptor,
  }
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params
  if (planet === 'education') return <EducationPanel />
  return null
}
