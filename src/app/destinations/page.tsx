import Link from 'next/link'
import { buildSceneData } from '@/lib/content/scene-data'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'

export default function DestinationsPage() {
  const data = buildSceneData()
  const posts: any = loadCollection('blog', blogFrontmatter as any)
  return (
    <main className="panel-body" style={{ maxWidth: 720, margin: '0 auto', height: '100dvh' }}>
      <p className="kicker">Destination index</p>
      <h1>All destinations</h1>
      {data.map((d) => (
        <section key={d.slug}>
          <h2 style={{ marginTop: '1.5em' }}>
            <Link href={`/${d.slug}`}>{d.name}</Link>
          </h2>
          <ul>
            {d.cityNodes.map((c) => (
              <li key={c.slug}>
                <Link href={c.href}>{c.name}</Link> — {c.descriptor}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2 style={{ marginTop: '1.5em' }}>All posts</h2>
        <ul>
          {posts.map((p: any) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.frontmatter.topic}/${p.slug}`}>{p.frontmatter.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
