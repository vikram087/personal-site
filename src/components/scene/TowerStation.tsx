'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/lib/store'

const RING_WINDOWS = 14
const SPOKES = 4
const PYLONS = 3

const hullMaterial = { color: '#8E99AC', metalness: 0.55, roughness: 0.4 } as const
const panelMaterial = { color: '#5A6880', metalness: 0.6, roughness: 0.5 } as const
const brightMaterial = { color: '#C6D0E2', metalness: 0.65, roughness: 0.3 } as const

export function TowerStation({ accent }: { accent: string }) {
  const beacon = useRef<THREE.Mesh>(null)
  const habRing = useRef<THREE.Group>(null)
  const upperRing = useRef<THREE.Mesh>(null)
  const radar = useRef<THREE.Group>(null)
  const navLights = useRef<THREE.Group>(null)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (beacon.current) {
      const material = beacon.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.5 + 0.5 * Math.sin(t * 2)
    }
    if (navLights.current) {
      navLights.current.children.forEach((light, i) => {
        const material = (light as THREE.Mesh).material as THREE.MeshBasicMaterial
        material.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 1.6 + i * 2.1))
      })
    }
    if (reducedMotion) return
    if (habRing.current) habRing.current.rotation.y += delta * 0.22
    if (upperRing.current) upperRing.current.rotation.z -= delta * 0.3
    if (radar.current) radar.current.rotation.y += delta * 0.8
  })

  return (
    <group>
      {/* Work lights so the station reads even when sun-shadowed */}
      <pointLight color="#FFF1DE" intensity={2.5} distance={7} decay={2} position={[1.6, 1.4, 1.8]} />
      <pointLight color={accent} intensity={1.6} distance={5} decay={2} position={[-1.2, -0.6, 1.4]} />
      {/* Central spire: base skirt → mid column → upper column */}
      <mesh position={[0, -0.72, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 0.35, 10]} />
        <meshStandardMaterial {...panelMaterial} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.24, 0.42, 1.5, 10]} />
        <meshStandardMaterial {...hullMaterial} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 0.55, 8]} />
        <meshStandardMaterial {...brightMaterial} />
      </mesh>

      {/* Hull greebles: offset panel boxes around the column */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.4
        const r = 0.34 - (i % 3) * 0.03
        const y = -0.35 + (i % 3) * 0.32
        return (
          <mesh
            key={`greeble-${i}`}
            position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.1, 0.16 + (i % 2) * 0.1, 0.05]} />
            <meshStandardMaterial {...panelMaterial} />
          </mesh>
        )
      })}

      {/* Rotating habitat ring with spokes and lit windows */}
      <group ref={habRing} position={[0, 0.42, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.055, 10, 56]} />
          <meshStandardMaterial {...brightMaterial} />
        </mesh>
        {Array.from({ length: SPOKES }, (_, i) => {
          const angle = (i / SPOKES) * Math.PI * 2
          return (
            <mesh key={`spoke-${i}`} position={[Math.cos(angle) * 0.39, 0, Math.sin(angle) * 0.39]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.78, 0.03, 0.03]} />
              <meshStandardMaterial {...hullMaterial} />
            </mesh>
          )
        })}
        {Array.from({ length: RING_WINDOWS }, (_, i) => {
          const angle = (i / RING_WINDOWS) * Math.PI * 2
          return (
            <mesh key={`window-${i}`} position={[Math.cos(angle) * 0.78, 0, Math.sin(angle) * 0.78]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          )
        })}
      </group>

      {/* Upper counter-rotating gyro ring */}
      <mesh ref={upperRing} position={[0, 0.92, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.34, 0.018, 8, 40]} />
        <meshStandardMaterial {...brightMaterial} />
      </mesh>

      {/* Docking pylons with blinking nav lights at the tips */}
      {Array.from({ length: PYLONS }, (_, i) => {
        const angle = (i / PYLONS) * Math.PI * 2 + 0.9
        return (
          <group key={`pylon-${i}`} position={[0, -0.42, 0]} rotation={[0, -angle, 0]}>
            <mesh position={[0.45, 0, 0]}>
              <boxGeometry args={[0.5, 0.05, 0.08]} />
              <meshStandardMaterial {...hullMaterial} />
            </mesh>
            <mesh position={[0.72, 0.05, 0]}>
              <boxGeometry args={[0.08, 0.14, 0.12]} />
              <meshStandardMaterial {...panelMaterial} />
            </mesh>
          </group>
        )
      })}
      <group ref={navLights}>
        {Array.from({ length: PYLONS }, (_, i) => {
          const angle = (i / PYLONS) * Math.PI * 2 + 0.9
          return (
            <mesh key={`nav-${i}`} position={[Math.cos(angle) * 0.72, -0.3, -Math.sin(angle) * 0.72]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color={accent} transparent />
            </mesh>
          )
        })}
      </group>

      {/* Antenna array + rotating radar dish */}
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
        <meshStandardMaterial {...brightMaterial} />
      </mesh>
      <mesh position={[0.07, 1.28, 0.04]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        <meshStandardMaterial {...hullMaterial} />
      </mesh>
      <group ref={radar} position={[-0.16, 1.18, 0]}>
        <mesh rotation={[0, 0, 0.9]}>
          <coneGeometry args={[0.13, 0.08, 14, 1, true]} />
          <meshStandardMaterial {...brightMaterial} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={beacon} position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={accent} transparent />
      </mesh>
    </group>
  )
}
