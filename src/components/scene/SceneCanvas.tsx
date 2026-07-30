'use client'
import { Canvas } from '@react-three/fiber'
import { Starfield } from '@/components/scene/Starfield'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

export default function SceneCanvas({ sceneData }: { sceneData: DestinationNode[] }) {
  const tier = useSceneStore((s) => s.tier)
  return (
    <Canvas
      dpr={tier === 'high' ? [1, 2] : 1}
      camera={{ position: [0, 0, 14], fov: 50 }}
      style={{ position: 'fixed', inset: 0 }}
      aria-hidden
    >
      <color attach="background" args={['#060A12']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 8, 6]} intensity={1.1} />
      <Starfield />
      {/* Task 9: <DestinationField sceneData={sceneData} /> + <CameraRig sceneData={sceneData} /> */}
    </Canvas>
  )
}
