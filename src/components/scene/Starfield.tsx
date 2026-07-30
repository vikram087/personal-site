'use client'
import { Stars } from '@react-three/drei'
import { useSceneStore } from '@/lib/store'

export function Starfield() {
  const tier = useSceneStore((s) => s.tier)
  return <Stars radius={70} depth={45} count={tier === 'high' ? 6500 : 1500} factor={3.5} saturation={0.28} fade speed={0.35} />
}
