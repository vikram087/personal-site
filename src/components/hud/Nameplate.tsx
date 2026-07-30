'use client'
import type { CSSProperties } from 'react'

export function Nameplate({
  name,
  descriptor,
  accent,
  onSelect,
}: {
  name: string
  descriptor: string
  accent: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className="nameplate"
      style={{ '--accent': accent, pointerEvents: 'auto' } as CSSProperties}
      onClick={onSelect}
    >
      <span>{name}</span>
      <span className="descriptor">{descriptor}</span>
    </button>
  )
}
