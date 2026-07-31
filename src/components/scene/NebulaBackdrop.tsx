'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '@/lib/store'

/**
 * Painted skysphere: the baked nebula/galaxy equirect (sky.webp) on an
 * inverted sphere, drifting imperceptibly. Cheap enough for every tier.
 */
export function NebulaBackdrop() {
  const mesh = useRef<THREE.Mesh>(null)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const sky = useTexture('/textures/sky.webp')
  sky.colorSpace = THREE.SRGBColorSpace

  useFrame((_, delta) => {
    if (mesh.current && !reducedMotion) {
      mesh.current.rotation.y += delta * 0.0018
    }
  })

  return (
    // The sky sphere surrounds the camera, so without this every pointer ray
    // "hits" it and the canvas' onPointerMissed dismissal never fires.
    <mesh ref={mesh} raycast={() => null}>
      <sphereGeometry args={[85, 48, 48]} />
      <meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  )
}
