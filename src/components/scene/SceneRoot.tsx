'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { LoadingScreen } from '@/components/hud/LoadingScreen'
import { SceneSettings } from '@/components/scene/SceneSettings'
import type { DestinationNode } from '@/lib/content/scene-data'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const fallbackNotice = (
  <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 30 }}>
    <p className="kicker">
      3D unavailable on this device — <Link href="/destinations">browse the destination index</Link>
    </p>
  </div>
)

export function SceneRoot({
  sceneData,
  hud,
  children,
}: {
  sceneData: DestinationNode[]
  hud?: ReactNode
  children: ReactNode
}) {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  useEffect(() => setWebgl(webglSupported()), [])

  return (
    <>
      <SceneSettings />
      {webgl === null && <LoadingScreen />}
      {webgl === true && (
        <SceneErrorBoundary fallback={fallbackNotice}>
          <Suspense fallback={<LoadingScreen />}>
            <SceneCanvas sceneData={sceneData} />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {webgl === false && fallbackNotice}
      {hud}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>{children}</div>
    </>
  )
}
