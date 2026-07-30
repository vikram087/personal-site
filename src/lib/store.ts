import { create } from 'zustand'

type Tier = 'high' | 'low'

type SceneState = {
  hovered: string | null
  tier: Tier
  reducedMotion: boolean
  setHovered: (slug: string | null) => void
  setTier: (tier: Tier) => void
  setReducedMotion: (value: boolean) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  hovered: null,
  tier: 'high',
  reducedMotion: false,
  setHovered: (hovered) => set({ hovered }),
  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}))
