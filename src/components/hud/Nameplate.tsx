'use client'
import type { CSSProperties } from 'react'

export function Nameplate({
  name,
  descriptor,
  accent,
  variant,
  onSelect,
}: {
  name: string
  descriptor: string
  accent: string
  /** 'marker' adds a dark chip behind the text so it stays readable over bright planet surfaces */
  variant?: 'marker'
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={variant === 'marker' ? 'nameplate nameplate--marker' : 'nameplate'}
      style={{ '--accent': accent, pointerEvents: 'auto' } as CSSProperties}
      onClick={onSelect}
    >
      <span>{name}</span>
      <span className="descriptor">{descriptor}</span>
    </button>
  )
}
