'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/lib/store'

/**
 * Education's gyroscope: two thin luminous rings precessing around the planet
 * on different axes. Emissive enough for bloom to catch.
 */
export function PlanetRing({ accent }: { accent: string }) {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (outer.current) {
      outer.current.rotation.z += delta * 0.12
      outer.current.rotation.x += delta * 0.05
    }
    if (inner.current) {
      inner.current.rotation.z -= delta * 0.18
      inner.current.rotation.y += delta * 0.07
    }
  })

  return (
    <group>
      <mesh ref={outer} rotation={[Math.PI / 2.6, 0.4, 0]}>
        <torusGeometry args={[2.25, 0.015, 8, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.65} />
      </mesh>
      <mesh ref={inner} rotation={[Math.PI / 1.8, -0.5, 0.4]}>
        <torusGeometry args={[2.0, 0.01, 8, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
