'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Planet } from '@/components/scene/Planet'
import { CityMarker } from '@/components/scene/CityMarker'
import { parseRoute } from '@/lib/nav'
import type { DestinationNode } from '@/lib/content/scene-data'

const PLANET_MARKER_RADIUS = 1.45
const STATION_MARKER_RADIUS = 1.0

export function DestinationField({ sceneData }: { sceneData: DestinationNode[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))
  const focusedSlug = target.view === 'director' ? null : target.planet

  return (
    <>
      {sceneData.map((node) => (
        <Planet
          key={node.slug}
          node={node}
          focused={focusedSlug === node.slug}
          onSelect={() => router.push(`/${node.slug}`)}
        >
          {focusedSlug === node.slug &&
            node.cityNodes.map((city) => (
              <CityMarker
                key={city.slug}
                city={city}
                accent={node.accent}
                radius={node.kind === 'station' ? STATION_MARKER_RADIUS : PLANET_MARKER_RADIUS}
                onSelect={() => router.push(city.href)}
              />
            ))}
        </Planet>
      ))}
    </>
  )
}
