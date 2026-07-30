'use client'
import { useRef, type ReactNode } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { PlanetMaterial } from '@/components/scene/PlanetMaterial'
import { Nameplate } from '@/components/hud/Nameplate'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

extend({ PlanetMaterial })

export function Planet({
  node,
  focused,
  onSelect,
  children,
}: {
  node: DestinationNode
  focused: boolean
  onSelect: () => void
  children?: ReactNode
}) {
  const material = useRef<THREE.ShaderMaterial & { uTime: number }>(null)
  const group = useRef<THREE.Group>(null)
  const setHovered = useSceneStore((s) => s.setHovered)

  useFrame((_, delta) => {
    if (material.current) material.current.uTime += delta
    if (group.current && !focused) group.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={group} position={node.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={() => {
          setHovered(node.slug)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[1.4, 48, 48]} />
        {/* @ts-expect-error extended element */}
        <planetMaterial ref={material} uColor={new THREE.Color(node.accent)} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color={node.accent} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {!focused && (
        <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]}>
          <Nameplate name={node.name} descriptor={node.descriptor} accent={node.accent} onSelect={onSelect} />
        </Html>
      )}
      {children}
    </group>
  )
}
