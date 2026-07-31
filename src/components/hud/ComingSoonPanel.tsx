import type { ReactNode } from 'react'
import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'

export function ComingSoonPanel({
  planet = 'tower',
  kicker = 'The Tower · Live Feed',
  title = 'Transmission offline',
  children,
}: {
  planet?: string
  kicker?: string
  title?: string
  children?: ReactNode
}) {
  return (
    <Panel accent={accentOf(planet)} kicker={kicker} title={title}>
      {children ?? (
        <p>This channel isn&apos;t broadcasting yet. A live feed is planned — check back soon.</p>
      )}
    </Panel>
  )
}
