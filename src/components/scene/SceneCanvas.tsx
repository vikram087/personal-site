'use client'
import { Canvas, type RootState } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Starfield } from '@/components/scene/Starfield'
import { DestinationField } from '@/components/scene/DestinationField'
import { CameraRig } from '@/components/scene/CameraRig'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

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

  const handleCreated = useCallback((state: RootState) => {
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
      camera={{ position: [0, 0, 14], fov: 50 }}
      style={{ position: 'fixed', inset: 0 }}
      onCreated={handleCreated}
    >
      <color attach="background" args={['#060A12']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 8, 6]} intensity={1.1} />
      <Starfield />
      <DestinationField sceneData={sceneData} />
      <CameraRig sceneData={sceneData} />
    </Canvas>
  )
}
