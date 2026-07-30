import type { Metadata } from 'next'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { PostPanel } from '@/components/panels/PostPanel'
import { ComingSoonPanel } from '@/components/hud/ComingSoonPanel'
import { SITE_METADATA } from '@/config/site-metadata'

export const dynamicParams = false

// With `output: export` a dynamic route must generate at least one path. While
// the blog is empty we emit a hidden sentinel (nothing links to it) that renders
// the coming-soon panel; it disappears as soon as the first post lands.
const SENTINEL = { topic: 'signal', slug: 'coming-soon' }

export function generateStaticParams() {
  const posts = loadCollection('blog', blogFrontmatter)
  if (posts.length === 0) return [SENTINEL]
  return posts.map((p) => ({ topic: p.frontmatter.topic, slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>
}): Promise<Metadata> {
  const { topic, slug } = await params
  const post = loadCollection('blog', blogFrontmatter).find(
    (p) => p.slug === slug && p.frontmatter.topic === topic,
  )
  if (!post) return SITE_METADATA
  return {
    title: `${post.frontmatter.title} — Vikram Penumarti`,
    description: post.frontmatter.summary,
  }
}

export default async function PostPage({ params }: { params: Promise<{ topic: string; slug: string }> }) {
  const { topic, slug } = await params
  const exists = loadCollection('blog', blogFrontmatter).some(
    (p) => p.slug === slug && p.frontmatter.topic === topic,
  )
  if (!exists) {
    return (
      <ComingSoonPanel planet="blog" kicker="Blog" title="Transmissions coming soon" backHref="/">
        <p>Nothing published yet — the first transmissions are being drafted.</p>
      </ComingSoonPanel>
    )
  }
  return <PostPanel topic={topic} slug={slug} />
}
