'use client'
import { useRef, type ReactNode } from 'react'
import { useFrame, extend, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { PlanetMaterial } from '@/components/scene/PlanetMaterial'
import { TowerStation } from '@/components/scene/TowerStation'
import { Nameplate } from '@/components/hud/Nameplate'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

extend({ PlanetMaterial })

const AUTO_ROTATE_SPEED = 0.05
const FOCUSED_ROTATE_SPEED = 0.02
const DRAG_ROTATE_SPEED = 0.005

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
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartRotationY = useRef(0)

  useFrame((_, delta) => {
    if (material.current) material.current.uTime += delta
    if (!group.current) return
    if (!focused) {
      group.current.rotation.y += delta * AUTO_ROTATE_SPEED
    } else if (!dragging.current) {
      group.current.rotation.y += delta * FOCUSED_ROTATE_SPEED
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!focused || !group.current) return
    e.stopPropagation()
    dragging.current = true
    dragStartX.current = e.clientX
    dragStartRotationY.current = group.current.rotation.y
    // @ts-expect-error setPointerCapture is not in the R3F event type definition
    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!focused || !dragging.current || !group.current) return
    group.current.rotation.y = dragStartRotationY.current + (e.clientX - dragStartX.current) * DRAG_ROTATE_SPEED
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = false
    // @ts-expect-error releasePointerCapture is not in the R3F event type definition
    e.target.releasePointerCapture(e.pointerId)
  }

  const hoverHandlers = {
    onPointerOver: () => {
      setHovered(node.slug)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHovered(null)
      document.body.style.cursor = 'auto'
    },
  }

  return (
    <group
      ref={group}
      position={node.position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {node.kind === 'station' ? (
        <group
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          {...hoverHandlers}
        >
          <TowerStation accent={node.accent} />
        </group>
      ) : (
        <>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            {...hoverHandlers}
          >
            <sphereGeometry args={[1.4, 48, 48]} />
            {/* @ts-expect-error extended element */}
            <planetMaterial ref={material} uColor={new THREE.Color(node.accent)} />
          </mesh>
          <mesh scale={1.12}>
            <sphereGeometry args={[1.4, 32, 32]} />
            <meshBasicMaterial color={node.accent} transparent opacity={0.08} side={THREE.BackSide} />
          </mesh>
        </>
      )}
      {!focused && (
        <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]}>
          <Nameplate name={node.name} descriptor={node.descriptor} accent={node.accent} onSelect={onSelect} />
        </Html>
      )}
      {children}
    </group>
  )
}
