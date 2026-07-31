'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { LoadingScreen } from '@/components/hud/LoadingScreen'
import { LocationBar } from '@/components/hud/LocationBar'
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
  const [contextFatal, setContextFatal] = useState(false)
  useEffect(() => setWebgl(webglSupported()), [])

  // Spec: "WebGL context lost: attempt one recovery, then fall back to index."
  // SceneCanvas gives the recovery attempt a bounded window; once it gives up
  // (second loss or restore timeout), it calls this to drop us to the same
  // fallback notice used when WebGL isn't supported at all.
  const handleContextFatal = useCallback(() => setContextFatal(true), [])

  const showScene = webgl === true && !contextFatal

  return (
    <>
      <SceneSettings />
      {webgl === null && <LoadingScreen />}
      {showScene && (
        <SceneErrorBoundary fallback={fallbackNotice}>
          <Suspense fallback={<LoadingScreen />}>
            <SceneCanvas sceneData={sceneData} onContextFatal={handleContextFatal} />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {(webgl === false || contextFatal) && fallbackNotice}
      {hud}
      {showScene && <LocationBar sceneData={sceneData} />}
      <div className="viewport-frame" aria-hidden>
        <span /><span /><span /><span />
      </div>
      <a className="ssh-hint" href="ssh://vik.run" title="This site, in your terminal">
        ssh vik.run
      </a>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>{children}</div>
    </>
  )
}
