'use client'
import { Stars } from '@react-three/drei'
import { useSceneStore } from '@/lib/store'

export function Starfield() {
  const tier = useSceneStore((s) => s.tier)
  return <Stars radius={80} depth={40} count={tier === 'high' ? 4000 : 1200} factor={3} saturation={0} fade speed={0.4} />
}
