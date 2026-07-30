import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'

export function generateStaticParams() {
  const posts: any = loadCollection('blog', blogFrontmatter as any)
  return posts.map((p: any) => ({ topic: p.frontmatter.topic, slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ topic: string; slug: string }> }) {
  const { slug } = await params
  return <div data-panel={`post/${slug}`}>Post panel (Task 11)</div>
}
