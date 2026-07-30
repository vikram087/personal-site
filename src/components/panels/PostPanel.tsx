import { notFound } from 'next/navigation'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function PostPanel({ topic, slug }: { topic: string; slug: string }) {
  const post = loadCollection('blog', blogFrontmatter).find(
    (p) => p.slug === slug && p.frontmatter.topic === topic,
  )
  if (!post) notFound()
  return (
    <Panel
      accent="#9F6BFF"
      kicker={`Blog · ${topic} · ${post.frontmatter.date.toISOString().slice(0, 10)}`}
      title={post.frontmatter.title}
      backHref={`/blog/${topic}`}
    >
      <Mdx source={post.body} />
    </Panel>
  )
}
