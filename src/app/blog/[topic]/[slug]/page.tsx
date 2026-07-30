import type { Metadata } from 'next'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { PostPanel } from '@/components/panels/PostPanel'
import { SITE_METADATA } from '@/config/site-metadata'

export function generateStaticParams() {
  return loadCollection('blog', blogFrontmatter).map((p) => ({ topic: p.frontmatter.topic, slug: p.slug }))
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
  return <PostPanel topic={topic} slug={slug} />
}
