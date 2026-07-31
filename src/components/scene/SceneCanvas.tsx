'use client'
import { Canvas, type RootState } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { routeUp } from '@/lib/nav'
import { useTexture } from '@react-three/drei'
import { Starfield } from '@/components/scene/Starfield'
import { NebulaBackdrop } from '@/components/scene/NebulaBackdrop'
import { Effects } from '@/components/scene/Effects'
import { DestinationField } from '@/components/scene/DestinationField'
import { CameraRig } from '@/components/scene/CameraRig'
import { SUN_DIRECTION } from '@/components/scene/PlanetMaterial'
import { DESTINATIONS } from '@/config/destinations'
import { SCENE_FOV } from '@/lib/camera-fit'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

// Warm every texture during the loading screen so destination views never
// pop in behind Suspense.
const PLANET_TEXTURE_URLS = DESTINATIONS.filter((d) => d.kind === 'planet').flatMap((d) => [
  `/textures/${d.slug}-albedo.webp`,
  `/textures/${d.slug}-normal.webp`,
  `/textures/${d.slug}-emissive.webp`,
])
;[...PLANET_TEXTURE_URLS, '/textures/clouds.webp', '/textures/sky.webp'].forEach((url) => {
  useTexture.preload(url)
})

// Spec: "WebGL context lost: attempt one recovery, then fall back to index."
const RESTORE_TIMEOUT_MS = 3000

export default function SceneCanvas({
  sceneData,
  onContextFatal,
}: {
  sceneData: DestinationNode[]
  onContextFatal?: () => void
}) {
  const tier = useSceneStore((s) => s.tier)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const lossCountRef = useRef(0)
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  // Clicking empty space dismisses the current view one level up (city → orbit
  // → starmap), replacing the old back buttons. onPointerMissed also fires for
  // clicks on DOM overlays inside the canvas container (nameplates), so only
  // clicks landing on the canvas itself count. A movement threshold keeps
  // drag-rotating the scene from being read as a dismissal click.
  const handlePointerMissed = useCallback(
    (e: MouseEvent) => {
      if (pathname === '/' || e.target !== canvasEl) return
      const down = pointerDownRef.current
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return
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
      style={{ position: 'fixed', inset: 0 }}
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
      </Suspense>
      <CameraRig sceneData={sceneData} />
      <Effects />
    </Canvas>
  )
}
