import { notFound } from 'next/navigation'
import { loadCollection } from '@/lib/content/loader'
import { hobbyFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function HobbyPanel({ slug }: { slug: string }) {
  const entry = loadCollection('hobbies', hobbyFrontmatter).find((e) => e.slug === slug)
  if (!entry) notFound()
  return (
    <Panel accent="#35E0B2" kicker="Hobbies" title={entry.frontmatter.title} backHref="/hobbies">
      <Mdx source={entry.body} />
    </Panel>
  )
}
