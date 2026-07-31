'use client'
import { usePathname } from 'next/navigation'
import { parseRoute } from '@/lib/nav'
import type { DestinationNode } from '@/lib/content/scene-data'

/**
 * Always-visible wayfinding: shows where you are. Going a level up is done by
 * clicking empty space (canvas onPointerMissed) or pressing Escape.
 */
export function LocationBar({ sceneData }: { sceneData: DestinationNode[] }) {
  const pathname = usePathname()
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))

  if (target.view === 'director') return null

  const destination = sceneData.find((d) => d.slug === target.planet)
  if (!destination) return null

  const city =
    target.view === 'city' ? destination.cityNodes.find((c) => c.slug === target.city) : undefined
  const location =
    target.view === 'city'
      ? `${destination.name} · ${city?.name ?? target.city}`
      : `Orbit · ${destination.name}`
  // A panel is open in city view, on auto-open destinations (Education), and on
  // destinations with no cities yet (empty Blog) — shift the bar off the panel.
  const panelOpen =
    target.view === 'city' || destination.autoOpenPanel === true || destination.cityNodes.length === 0

  return (
    <div className={panelOpen ? 'location-bar location-bar--panel-open' : 'location-bar'}>
      <p className="kicker location-name">{location}</p>
      <span className="kicker esc-hint" aria-hidden>
        esc
      </span>
    </div>
  )
}
