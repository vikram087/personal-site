'use client'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { routeUp } from '@/lib/nav'
import { useProgress, useTexture } from '@react-three/drei'
import { Starfield } from '@/components/scene/Starfield'
import { NebulaBackdrop } from '@/components/scene/NebulaBackdrop'
import { Effects } from '@/components/scene/Effects'
import { DestinationField } from '@/components/scene/DestinationField'
import { CameraRig } from '@/components/scene/CameraRig'
import { SUN_DIRECTION } from '@/components/scene/PlanetMaterial'
import { SCENE_FOV } from '@/lib/camera-fit'
import { SCENE_TEXTURE_URLS } from '@/lib/scene-textures'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

// Warm every texture during the loading screen so destination views never
// pop in behind Suspense. SceneRoot already started the HTTP fetches in
// parallel with this chunk's download; this feeds them into drei's cache.
SCENE_TEXTURE_URLS.forEach((url) => {
  useTexture.preload(url)
})

// Spec: "WebGL context lost: attempt one recovery, then fall back to index."
const RESTORE_TIMEOUT_MS = 3000

// Mounts inside the scene Suspense boundary, so its frame callback only runs
// once every textured sibling has resolved. Frame 1 renders the scene (and
// compiles shaders); by frame 2 a real frame is on screen and the loading
// overlay can fade.
function SceneReadySignal({ onReady }: { onReady?: () => void }) {
  const frameCountRef = useRef(0)
  useFrame(() => {
    frameCountRef.current += 1
    if (frameCountRef.current === 2) onReady?.()
  })
  return null
}

export default function SceneCanvas({
  sceneData,
  onContextFatal,
  onReady,
  onProgress,
}: {
  sceneData: DestinationNode[]
  onContextFatal?: () => void
  onReady?: () => void
  onProgress?: (progress: number) => void
}) {
  const tier = useSceneStore((s) => s.tier)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const lossCountRef = useRef(0)
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  // Surface texture-load progress (drei's loading manager) to the loading
  // overlay, which lives outside this chunk.
  const progress = useProgress((s) => s.progress)
  useEffect(() => {
    onProgress?.(progress)
  }, [progress, onProgress])

  // Clicking empty space dismisses the current view one level up (city → orbit
  // → starmap), replacing the old back buttons. onPointerMissed also fires for
  // clicks on DOM overlays inside the canvas container (nameplates), so only
  // clicks landing on the canvas itself count. A movement threshold keeps
  // drag-rotating the scene from being read as a dismissal click.
  const handlePointerMissed = useCallback(
    (e: MouseEvent) => {
      if (pathname === '/' || e.target !== canvasEl) return
      const down = pointerDownRef.current
      // Touch drags wobble more than mouse drags — give coarse pointers a
      // larger tap threshold so drag-rotation is never read as a dismissal.
      const threshold = window.matchMedia('(pointer: coarse)').matches ? 12 : 8
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > threshold) return
      router.push(routeUp(pathname))
    },
    [pathname, router, canvasEl],
  )

  useEffect(() => {
    if (!canvasEl) return undefined
    const onPointerDown = (e: PointerEvent) => {
      pointerDownRef.current = { x: e.clientX, y: e.clientY }
    }
    canvasEl.addEventListener('pointerdown', onPointerDown)
    return () => canvasEl.removeEventListener('pointerdown', onPointerDown)
  }, [canvasEl])

  const handleCreated = useCallback((state: RootState) => {
    state.gl.toneMappingExposure = 1.18
    // Star points must never swallow pointer rays, or clicks on empty space
    // would not reach onPointerMissed (which handles dismiss-to-parent).
    state.raycaster.params.Points.threshold = 0
    setCanvasEl(state.gl.domElement)
  }, [])

  useEffect(() => {
    if (!canvasEl || !onContextFatal) return undefined

    const clearRestoreTimer = () => {
      if (restoreTimerRef.current !== null) {
        clearTimeout(restoreTimerRef.current)
        restoreTimerRef.current = null
      }
    }

    const handleContextLost = (event: Event) => {
      // Allow the browser to attempt a restore instead of losing the context permanently.
      event.preventDefault()
      lossCountRef.current += 1
      if (lossCountRef.current > 1) {
        onContextFatal()
        return
      }
      // First loss: give the one allowed recovery attempt a bounded window to land.
      restoreTimerRef.current = setTimeout(() => onContextFatal(), RESTORE_TIMEOUT_MS)
    }

    const handleContextRestored = () => {
      clearRestoreTimer()
    }

    canvasEl.addEventListener('webglcontextlost', handleContextLost)
    canvasEl.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      clearRestoreTimer()
      canvasEl.removeEventListener('webglcontextlost', handleContextLost)
      canvasEl.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [canvasEl, onContextFatal])

  return (
    <Canvas
      dpr={tier === 'high' ? [1, 2] : 1}
      camera={{ position: [0, 0, 14], fov: SCENE_FOV }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
      onCreated={handleCreated}
      onPointerMissed={handlePointerMissed}
    >
      <color attach="background" args={['#060A12']} />
      <ambientLight intensity={0.16} color="#8FA3C8" />
      {/* Key light matches SUN_DIRECTION so shader terminators agree with mesh lighting. */}
      <directionalLight
        position={[SUN_DIRECTION.x * 20, SUN_DIRECTION.y * 20, SUN_DIRECTION.z * 20]}
        intensity={1.5}
        color="#FFF1DE"
      />
      <directionalLight position={[-12, -4, -10]} intensity={0.25} color="#4A5F8A" />
      <Suspense fallback={null}>
        <NebulaBackdrop />
        <Starfield />
        <DestinationField sceneData={sceneData} />
        <SceneReadySignal onReady={onReady} />
      </Suspense>
      <CameraRig sceneData={sceneData} />
      <Effects />
    </Canvas>
  )
}
