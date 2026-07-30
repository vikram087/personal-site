'use client'
import { useFrame } from '@react-three/fiber'
import { usePathname } from 'next/navigation'
import { easing } from 'maath'
import * as THREE from 'three'
import { parseRoute } from '@/lib/nav'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

const DIRECTOR_POS = new THREE.Vector3(0, 0, 14)
const ORIGIN = new THREE.Vector3(0, 0, 0)

export function CameraRig({ sceneData }: { sceneData: DestinationNode[] }) {
  const pathname = usePathname()
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))

  useFrame((state, delta) => {
    const focused = target.view === 'director' ? null : sceneData.find((d) => d.slug === target.planet)
    const wanted = focused
      ? new THREE.Vector3(...focused.position).add(new THREE.Vector3(0, 0.4, 4.2))
      : DIRECTOR_POS
    const lookAt = focused ? new THREE.Vector3(...focused.position) : ORIGIN

    if (reducedMotion) {
      state.camera.position.copy(wanted)
    } else {
      easing.damp3(state.camera.position, wanted, 0.6, delta)
      if (!focused) {
        state.camera.position.x += Math.sin(state.clock.elapsedTime * 0.1) * 0.003
        state.camera.position.y += Math.cos(state.clock.elapsedTime * 0.08) * 0.002
      }
    }
    state.camera.lookAt(lookAt)
  })

  return null
}
