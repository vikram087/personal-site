'use client'
import { Html } from '@react-three/drei'
import { latLngToVector3 } from '@/lib/geo'
import { Nameplate } from '@/components/hud/Nameplate'
import type { CityNode } from '@/lib/content/scene-data'

export function CityMarker({
  city,
  accent,
  radius,
  onSelect,
}: {
  city: CityNode
  accent: string
  radius: number
  onSelect: () => void
}) {
  const position = latLngToVector3(city.lat, city.lng, radius)
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 4]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <planeGeometry args={[0.09, 0.09]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <Html position={[0, 0.18, 0]} center zIndexRange={[5, 0]} occlude>
        <Nameplate name={city.name} descriptor={city.descriptor} accent={accent} onSelect={onSelect} />
      </Html>
    </group>
  )
}
