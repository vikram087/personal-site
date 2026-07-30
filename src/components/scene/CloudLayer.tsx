'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '@/lib/store'

/** Shared with PlanetMaterial's cloud-shadow pass so shadows track the clouds. */
export function cloudRotation(elapsedTime: number, speed: number): number {
  return elapsedTime * 0.012 * (0.5 + speed)
}

/**
 * Animated cloud shell: the shared baked cloud alpha map on a slightly larger
 * sphere, lit by the scene sun, drifting independently of the surface below.
 */
export function CloudLayer({ opacity, speed }: { opacity: number; speed: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const clouds = useTexture('/textures/clouds.webp')

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = reducedMotion ? 0 : cloudRotation(state.clock.elapsedTime, speed)
    }
  })

  return (
    <mesh ref={mesh} scale={1.045}>
      <sphereGeometry args={[1.4, 48, 48]} />
      <meshStandardMaterial
        color="#ffffff"
        alphaMap={clouds}
        transparent
        opacity={opacity}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}
