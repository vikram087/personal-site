import { loadCollection } from '@/lib/content/loader'
import { baseFrontmatter } from '@/lib/content/schemas'
import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function EducationPanel() {
  const entries = loadCollection('education', baseFrontmatter)
  return (
    <Panel accent={accentOf('education')} kicker="Destination · Education" title="Education">
      {entries.map((e) => (
        <article key={e.slug} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem' }}>{e.frontmatter.title}</h2>
          <p className="kicker" style={{ margin: '4px 0 12px' }}>{e.frontmatter.summary}</p>
          <Mdx source={e.body} />
        </article>
      ))}
    </Panel>
  )
}
