'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { LoadingScreen } from '@/components/hud/LoadingScreen'
import { LocationBar } from '@/components/hud/LocationBar'
import { SceneSettings } from '@/components/scene/SceneSettings'
import { warmSceneTextures } from '@/lib/scene-textures'
import type { DestinationNode } from '@/lib/content/scene-data'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), { ssr: false })

// Keep the faded-out overlay mounted until its CSS opacity transition ends.
const OVERLAY_FADE_MS = 700

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
  const [sceneReady, setSceneReady] = useState(false)
  const [overlayGone, setOverlayGone] = useState(false)
  const [loadProgress, setLoadProgress] = useState<number | undefined>(undefined)
  useEffect(() => setWebgl(webglSupported()), [])

  // Textures are the largest payload (~MBs) and normally only start
  // downloading after the scene JS chunk arrives and evaluates. Kick their
  // downloads off here so they run in parallel with the chunk fetch. Gated on
  // the WebGL check so non-3D devices never pay for them.
  useEffect(() => {
    if (webgl === true) warmSceneTextures()
  }, [webgl])

  // Spec: "WebGL context lost: attempt one recovery, then fall back to index."
  // SceneCanvas gives the recovery attempt a bounded window; once it gives up
  // (second loss or restore timeout), it calls this to drop us to the same
  // fallback notice used when WebGL isn't supported at all.
  const handleContextFatal = useCallback(() => setContextFatal(true), [])
  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    if (!sceneReady) return undefined
    const timer = setTimeout(() => setOverlayGone(true), OVERLAY_FADE_MS)
    return () => clearTimeout(timer)
  }, [sceneReady])

  const showScene = webgl === true && !contextFatal
  // One overlay owns the whole load: WebGL probe → chunk download → texture
  // decode → first rendered frame. It fades once the scene has actually drawn,
  // so there is never a black gap between "loading" and "scene visible".
  const showOverlay = webgl === null || (showScene && !overlayGone)

  return (
    <>
      <SceneSettings />
      {showOverlay && <LoadingScreen progress={loadProgress} done={sceneReady} />}
      {showScene && (
        <SceneErrorBoundary fallback={fallbackNotice}>
          <Suspense fallback={null}>
            <SceneCanvas
              sceneData={sceneData}
              onContextFatal={handleContextFatal}
              onReady={handleSceneReady}
              onProgress={setLoadProgress}
            />
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
