'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Panel } from '@/components/hud/Panel'

type Overlay = 'about' | 'contact' | null

export function HudChrome({
  about,
  contact,
}: {
  about: ReactNode
  contact: ReactNode
}) {
  const [overlay, setOverlay] = useState<Overlay>(null)

  // An open overlay consumes Escape (capture phase) so it closes the panel
  // instead of reaching SceneSettings' route-up navigation handler.
  useEffect(() => {
    if (!overlay) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOverlay(null)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [overlay])

  return (
    <>
      <nav aria-label="Site controls" className="hud-nav">
        <button type="button" className="hud-button" onClick={() => setOverlay('about')}>
          Vikram Penumarti
        </button>
        <button type="button" className="hud-button" onClick={() => setOverlay('contact')}>
          Contact
        </button>
      </nav>
      {/* Invisible backdrop under the overlay panel: clicking off the panel
          dismisses it instead of reaching the scene's click-to-navigate. */}
      {overlay && (
        <div
          onClick={() => setOverlay(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 25 }}
          aria-hidden
        />
      )}
      <AnimatePresence>
        {overlay === 'about' && (
          <Panel accent="var(--starlight)" kicker="Guardian file" title="About" zIndex={26}>
            <button type="button" className="hud-button" onClick={() => setOverlay(null)} style={{ position: 'absolute', top: 24, right: 24 }}>
              Close
            </button>
            {about}
          </Panel>
        )}
        {overlay === 'contact' && (
          <Panel accent="var(--starlight)" kicker="Open a channel" title="Contact" zIndex={26}>
            <button type="button" className="hud-button" onClick={() => setOverlay(null)} style={{ position: 'absolute', top: 24, right: 24 }}>
              Close
            </button>
            {contact}
          </Panel>
        )}
      </AnimatePresence>
    </>
  )
}
