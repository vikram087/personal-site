'use client'
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Panel } from '@/components/hud/Panel'

type Overlay = 'about' | 'contact' | null
type AboutTab = 'about' | 'now' | 'uses'

export function HudChrome({
  about,
  now,
  uses,
  contact,
}: {
  about: ReactNode
  now: ReactNode
  uses: ReactNode
  contact: ReactNode
}) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [tab, setTab] = useState<AboutTab>('about')
  const tabs: { id: AboutTab; label: string; content: ReactNode }[] = [
    { id: 'about', label: 'About', content: about },
    { id: 'now', label: 'Now', content: now },
    { id: 'uses', label: 'Uses', content: uses },
  ]

  return (
    <>
      <nav
        aria-label="Site controls"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 30,
          display: 'flex', gap: 8, pointerEvents: 'auto',
        }}
      >
        <button type="button" className="hud-button" onClick={() => { setOverlay('about'); setTab('about') }}>
          Vikram Penumarti
        </button>
        <button type="button" className="hud-button" onClick={() => setOverlay('contact')}>
          Contact
        </button>
        <Link href="/destinations" className="hud-button" style={{ textDecoration: 'none', lineHeight: 1.5 }}>
          Index
        </Link>
      </nav>
      <AnimatePresence>
        {overlay === 'about' && (
          <Panel accent="var(--starlight)" kicker="Guardian file" title="About">
            <div role="tablist" aria-label="About sections" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className="hud-button"
                  style={tab === t.id ? { borderColor: 'var(--starlight)' } : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button type="button" className="hud-button" onClick={() => setOverlay(null)} style={{ position: 'absolute', top: 24, right: 24 }}>
              Close
            </button>
            {tabs.find((t) => t.id === tab)?.content}
          </Panel>
        )}
        {overlay === 'contact' && (
          <Panel accent="var(--starlight)" kicker="Open a channel" title="Contact">
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
