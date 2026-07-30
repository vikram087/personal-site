import Link from 'next/link'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { accentOf } from '@/config/destinations'
import { Panel } from '@/components/hud/Panel'

export function BlogTopicPanel({ topic }: { topic: string }) {
  const posts = loadCollection('blog', blogFrontmatter).filter((p) => p.frontmatter.topic === topic)
  return (
    <Panel accent={accentOf('blog')} kicker="Blog · Topic" title={topic} backHref="/blog">
      <ul style={{ listStyle: 'none' }}>
        {posts.map((p) => (
          <li key={p.slug} style={{ marginBottom: '1.5rem' }}>
            <Link href={`/blog/${topic}/${p.slug}`} className="display" style={{ fontSize: '1rem' }}>
              {p.frontmatter.title}
            </Link>
            <p className="kicker" style={{ marginTop: 4 }}>
              {p.frontmatter.date.toISOString().slice(0, 10)} — {p.frontmatter.summary}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
