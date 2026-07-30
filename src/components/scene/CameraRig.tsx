'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePathname } from 'next/navigation'
import { easing } from 'maath'
import * as THREE from 'three'
import { parseRoute } from '@/lib/nav'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

const DIRECTOR_POS = new THREE.Vector3(0, 0, 14)
const ORIGIN = new THREE.Vector3(0, 0, 0)
const FLIGHT_SMOOTHING = 0.6

export function CameraRig({ sceneData }: { sceneData: DestinationNode[] }) {
  const pathname = usePathname()
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))
  // Damping the look-at point (not just position) makes the fly-out mirror the
  // fly-in — camera orientation eases along the same path in both directions.
  const lookAt = useRef(ORIGIN.clone())

  useFrame((state, delta) => {
    const focused = target.view === 'director' ? null : sceneData.find((d) => d.slug === target.planet)
    // Approach from slightly sun-opposed so the terminator (and night-side
    // city lights) sweep across the visible limb — the cinematic angle.
    const wantedPos = focused
      ? new THREE.Vector3(...focused.position).add(new THREE.Vector3(1.7, 0.5, 3.7))
      : DIRECTOR_POS
    const wantedLookAt = focused ? new THREE.Vector3(...focused.position) : ORIGIN

    if (reducedMotion) {
      state.camera.position.copy(wantedPos)
      lookAt.current.copy(wantedLookAt)
    } else {
      easing.damp3(state.camera.position, wantedPos, FLIGHT_SMOOTHING, delta)
      easing.damp3(lookAt.current, wantedLookAt, FLIGHT_SMOOTHING, delta)
      if (!focused) {
        state.camera.position.x += Math.sin(state.clock.elapsedTime * 0.1) * 0.003
        state.camera.position.y += Math.cos(state.clock.elapsedTime * 0.08) * 0.002
      }
    }
    state.camera.lookAt(lookAt.current)
  })

  return null
}
