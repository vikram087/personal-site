'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { routeUp } from '@/lib/nav'

export function Panel({
  accent,
  title,
  kicker,
  zIndex,
  onClose,
  children,
}: {
  accent: string
  title: string
  kicker: string
  /** Overrides the default stacking (20) — HUD overlays sit above their dismiss backdrop. */
  zIndex?: number
  /** Close action; defaults to navigating one route level up (same as click-outside). */
  onClose?: () => void
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.aside
      className="panel"
      style={{ '--accent': accent, ...(zIndex !== undefined ? { zIndex } : {}) } as CSSProperties}
      initial={reduced ? { opacity: 0 } : { x: 48, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label={title}
    >
      <header className="panel-header">
        <div className="panel-header-row">
          <div>
            <p className="kicker">{kicker}</p>
            <h1 style={{ fontSize: '1.4rem', marginTop: 4 }}>{title}</h1>
          </div>
          {onClose ? (
            <CloseButton title={title} onClick={onClose} />
          ) : (
            <RouteUpCloseButton title={title} />
          )}
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </motion.aside>
  )
}

function CloseButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button type="button" className="hud-button panel-close" onClick={onClick} aria-label={`Close ${title}`}>
      ✕
    </button>
  )
}

/**
 * Default close: navigate one route level up (same as click-outside/ESC).
 * Separate component so the router hooks only mount for route panels —
 * overlay panels (HudChrome) pass onClose and render outside test routers.
 */
function RouteUpCloseButton({ title }: { title: string }) {
  const router = useRouter()
  const pathname = usePathname()
  return <CloseButton title={title} onClick={() => router.push(routeUp(pathname))} />
}
