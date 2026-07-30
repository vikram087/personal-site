import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { PostPanel } from '@/components/panels/PostPanel'

export function generateStaticParams() {
  return loadCollection('blog', blogFrontmatter).map((p) => ({ topic: p.frontmatter.topic, slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ topic: string; slug: string }> }) {
  const { topic, slug } = await params
  return <PostPanel topic={topic} slug={slug} />
}
