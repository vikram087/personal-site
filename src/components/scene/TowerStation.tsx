'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function TowerStation({ accent }: { accent: string }) {
  const lights = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (lights.current) {
      const material = lights.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2)
    }
  })
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.25, 0.45, 1.6, 8]} />
        <meshStandardMaterial color="#8E99AC" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.06, 8, 32]} />
        <meshStandardMaterial color="#B8C2D4" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
        <meshStandardMaterial color="#8E99AC" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={lights} position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={accent} transparent />
      </mesh>
    </group>
  )
}
