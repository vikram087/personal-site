'use client'
import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

export function Panel({
  accent,
  title,
  kicker,
  zIndex,
  children,
}: {
  accent: string
  title: string
  kicker: string
  /** Overrides the default stacking (20) — HUD overlays sit above their dismiss backdrop. */
  zIndex?: number
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
        <p className="kicker">{kicker}</p>
        <h1 style={{ fontSize: '1.4rem', marginTop: 4 }}>{title}</h1>
      </header>
      <div className="panel-body">{children}</div>
    </motion.aside>
  )
}
