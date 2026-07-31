'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { pickTier } from '@/lib/device-tier'
import { routeUp } from '@/lib/nav'
import { useSceneStore } from '@/lib/store'

export function SceneSettings() {
  const setTier = useSceneStore((s) => s.setTier)
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    setTier(pickTier({ cores: nav.hardwareConcurrency ?? 4, memoryGb: nav.deviceMemory }))
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [setTier, setReducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || pathname === '/') return
      router.push(routeUp(pathname))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, router])

  return null
}
