import { describe, it, expect } from 'vitest'
import { useSceneStore } from '@/lib/store'

describe('useSceneStore', () => {
  it('starts idle on high tier', () => {
    const s = useSceneStore.getState()
    expect(s.hovered).toBeNull()
    expect(s.tier).toBe('high')
    expect(s.reducedMotion).toBe(false)
  })
  it('updates hover and tier immutably', () => {
    useSceneStore.getState().setHovered('blog')
    expect(useSceneStore.getState().hovered).toBe('blog')
    useSceneStore.getState().setTier('low')
    expect(useSceneStore.getState().tier).toBe('low')
    useSceneStore.getState().setHovered(null)
  })
})
