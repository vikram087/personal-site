import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'

export function ComingSoonPanel() {
  return (
    <Panel accent={accentOf('tower')} kicker="The Tower · Live Feed" title="Transmission offline" backHref="/tower">
      <p>This channel isn&apos;t broadcasting yet. A live feed is planned — check back soon.</p>
    </Panel>
  )
}
