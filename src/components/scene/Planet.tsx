'use client'
import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame, extend, type ThreeEvent } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'
import { PlanetMaterial } from '@/components/scene/PlanetMaterial'
import { AtmosphereMaterial } from '@/components/scene/AtmosphereMaterial'
import { PlanetRing } from '@/components/scene/PlanetRing'
import { CloudLayer, cloudRotation } from '@/components/scene/CloudLayer'
import { TowerStation } from '@/components/scene/TowerStation'
import { Nameplate } from '@/components/hud/Nameplate'
import { useSceneStore } from '@/lib/store'
import { shadeHex } from '@/lib/color'
import type { DestinationNode } from '@/lib/content/scene-data'

extend({ PlanetMaterial, AtmosphereMaterial })

const AUTO_ROTATE_SPEED = 0.05
const FOCUSED_ROTATE_SPEED = 0.02
const DRAG_ROTATE_SPEED = 0.005
const BOB_AMPLITUDE = 0.07
const HOVER_SCALE = 1.06

type PlanetShader = THREE.ShaderMaterial & { uHover: number; uCloudRot: number }
type AtmosphereShader = THREE.ShaderMaterial & { uBoost: number }

/** Loads the baked texture set and renders the planet surface + clouds. */
function PlanetSurface({
  node,
  materialRef,
  onSelect,
  hoverHandlers,
}: {
  node: DestinationNode
  materialRef: React.RefObject<PlanetShader | null>
  onSelect: () => void
  hoverHandlers: Record<string, () => void>
}) {
  const textures = useTexture({
    uAlbedo: `/textures/${node.slug}-albedo.webp`,
    uNormalMap: `/textures/${node.slug}-normal.webp`,
    uEmissiveMap: `/textures/${node.slug}-emissive.webp`,
    uCloudTex: '/textures/clouds.webp',
  })
  const accent = useMemo(() => new THREE.Color(node.accent), [node.accent])
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const cloudOpacity = node.look?.clouds ?? 0
  const flow = node.look?.flow ?? 0.5
  useMemo(() => {
    textures.uAlbedo.colorSpace = THREE.SRGBColorSpace
    textures.uEmissiveMap.colorSpace = THREE.SRGBColorSpace
    Object.values(textures).forEach((t) => {
      t.anisotropy = 8
    })
  }, [textures])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uCloudRot = reducedMotion ? 0 : cloudRotation(state.clock.elapsedTime, flow)
    }
  })

  return (
    <>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        {...hoverHandlers}
      >
        <sphereGeometry args={[1.4, 64, 64]} />
        {/* @ts-expect-error extended element */}
        <planetMaterial
          ref={materialRef}
          uAlbedo={textures.uAlbedo}
          uNormalMap={textures.uNormalMap}
          uEmissiveMap={textures.uEmissiveMap}
          uCloudTex={textures.uCloudTex}
          uAccent={accent}
          uEmissive={node.look?.emissive ?? 1}
          uCloudShadow={cloudOpacity * 0.8}
        />
      </mesh>
      {cloudOpacity > 0 && <CloudLayer opacity={cloudOpacity} speed={flow} />}
    </>
  )
}

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
  const material = useRef<PlanetShader>(null)
  const atmosphere = useRef<AtmosphereShader>(null)
  const group = useRef<THREE.Group>(null)
  const outer = useRef<THREE.Group>(null)
  const bobAmp = useRef(0)
  const hovered = useSceneStore((s) => s.hovered)
  const setHovered = useSceneStore((s) => s.setHovered)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartRotationY = useRef(0)

  const accent = useMemo(() => new THREE.Color(node.accent), [node.accent])
  const zenith = useMemo(() => new THREE.Color(shadeHex(node.accent, 1.5)), [node.accent])
  const bobPhase = useMemo(() => node.slug.charCodeAt(0) * 0.7, [node.slug])

  useFrame((state, delta) => {
    const isHovered = hovered === node.slug
    if (material.current) {
      easing.damp(material.current, 'uHover', isHovered ? 1 : 0, 0.2, delta)
    }
    if (atmosphere.current) {
      easing.damp(atmosphere.current, 'uBoost', isHovered && !focused ? 1 : 0, 0.2, delta)
    }
    if (outer.current) {
      // Gentle idle bob on the Director; eases to stillness when focused.
      const targetAmp = focused || reducedMotion ? 0 : BOB_AMPLITUDE
      bobAmp.current += (targetAmp - bobAmp.current) * Math.min(1, delta * 2.5)
      outer.current.position.y =
        node.position[1] + bobAmp.current * Math.sin(state.clock.elapsedTime * 0.45 + bobPhase)
      const targetScale = isHovered && !focused ? HOVER_SCALE : 1
      easing.damp3(outer.current.scale, [targetScale, targetScale, targetScale], 0.15, delta)
    }
    if (!group.current || reducedMotion) return
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
    // Outer group never rotates: city markers (children), nameplate, ring, and
    // light stay in stable world positions while the surface spins beneath them.
    <group ref={outer} position={node.position}>
      <group
        ref={group}
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
            <PlanetSurface node={node} materialRef={material} onSelect={onSelect} hoverHandlers={hoverHandlers} />
            {/* raycast disabled: the BackSide shell would otherwise swallow
                near-planet rays and block onPointerMissed dismissal clicks. */}
            <mesh scale={1.16} raycast={() => null}>
              <sphereGeometry args={[1.4, 48, 48]} />
              {/* @ts-expect-error extended element */}
              <atmosphereMaterial
                ref={atmosphere}
                uColorHorizon={accent}
                uColorZenith={zenith}
                uIntensity={0.9}
                side={THREE.BackSide}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </>
        )}
      </group>
      {node.kind !== 'station' && node.look?.ring && <PlanetRing accent={node.accent} />}
      {focused && (
        <pointLight color={node.accent} intensity={5} distance={10} decay={2} position={[2.2, 1.2, 3]} />
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
