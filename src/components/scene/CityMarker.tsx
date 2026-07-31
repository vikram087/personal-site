'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { latLngToVector3 } from '@/lib/geo'
import { Nameplate } from '@/components/hud/Nameplate'
import { useSceneStore } from '@/lib/store'
import type { CityNode } from '@/lib/content/scene-data'

export function CityMarker({
  city,
  accent,
  radius,
  lng,
  onSelect,
}: {
  city: CityNode
  accent: string
  radius: number
  /** Display longitude override — callers pass a camera-facing slot so all markers stay visible. */
  lng?: number
  onSelect: () => void
}) {
  const position = latLngToVector3(city.lat, lng ?? city.lng, radius)
  const diamond = useRef<THREE.Mesh>(null)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)

  useFrame((state) => {
    if (diamond.current && !reducedMotion) {
      const pulse = 1 + 0.14 * Math.sin(state.clock.elapsedTime * 2.4)
      diamond.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position}>
      <mesh ref={diamond} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.09, 0.09]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      {/* Invisible, larger hit area — the visual diamond is a tiny touch target */}
      <mesh rotation={[0, 0, Math.PI / 4]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <planeGeometry args={[0.24, 0.24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 0.18, 0]} center zIndexRange={[5, 0]}>
        <Nameplate name={city.name} descriptor={city.descriptor} accent={accent} variant="marker" onSelect={onSelect} />
      </Html>
    </group>
  )
}
