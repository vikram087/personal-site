'use client'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useSceneStore } from '@/lib/store'

/** Cinematic pass — high tier only; low-tier devices skip postprocessing. */
export function Effects() {
  const tier = useSceneStore((s) => s.tier)
  if (tier !== 'high') return null

  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.85} luminanceThreshold={0.28} luminanceSmoothing={0.6} mipmapBlur />
      <ChromaticAberration offset={[0.0009, 0.0006]} radialModulation modulationOffset={0.4} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.055} />
      <Vignette eskil={false} offset={0.2} darkness={0.6} />
    </EffectComposer>
  )
}
