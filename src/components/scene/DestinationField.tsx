'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Planet } from '@/components/scene/Planet'
import { parseRoute } from '@/lib/nav'
import type { DestinationNode } from '@/lib/content/scene-data'

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
        />
      ))}
    </>
  )
}
