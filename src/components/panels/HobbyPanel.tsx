import { notFound } from 'next/navigation'
import { loadCollection } from '@/lib/content/loader'
import { hobbyFrontmatter } from '@/lib/content/schemas'
import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function HobbyPanel({ slug }: { slug: string }) {
  const entry = loadCollection('hobbies', hobbyFrontmatter).find((e) => e.slug === slug)
  if (!entry) notFound()
  return (
    <Panel accent={accentOf('hobbies')} kicker="Hobbies" title={entry.frontmatter.title}>
      <Mdx source={entry.body} />
    </Panel>
  )
}
