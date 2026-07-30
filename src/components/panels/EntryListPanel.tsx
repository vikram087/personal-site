import { loadCollection, type Entry } from '@/lib/content/loader'
import { workFrontmatter, projectFrontmatter, baseFrontmatter } from '@/lib/content/schemas'
import type { WorkFrontmatter, ProjectFrontmatter, BaseFrontmatter } from '@/lib/content/schemas'
import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

const CITY_META = {
  work: { title: 'Work', schema: workFrontmatter },
  ventures: { title: 'Personal Ventures', schema: baseFrontmatter },
  projects: { title: 'Projects', schema: projectFrontmatter },
} as const

export function EntryListPanel({ city }: { city: keyof typeof CITY_META }) {
  const meta = CITY_META[city]
  const entries = loadCollection(`professional/${city}`, meta.schema) as Entry<
    WorkFrontmatter | ProjectFrontmatter | BaseFrontmatter
  >[]
  return (
    <Panel accent={accentOf('professional')} kicker={`Professional · ${meta.title}`} title={meta.title} backHref="/professional">
      {entries.map((e) => {
        const fm = e.frontmatter
        return (
          <article key={e.slug} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.05rem' }}>{fm.title}</h2>
            {'org' in fm && (
              <p className="kicker" style={{ margin: '4px 0' }}>{fm.role} · {fm.period}</p>
            )}
            <p className="kicker" style={{ margin: '4px 0 12px' }}>{fm.summary}</p>
            <Mdx source={e.body} />
            {'links' in fm && Object.entries(fm.links).map(([label, url]) => (
              <p key={label}>
                <a href={url} target="_blank" rel="noreferrer">{label} ↗</a>
              </p>
            ))}
          </article>
        )
      })}
    </Panel>
  )
}
