export function deriveTopics(posts: ReadonlyArray<{ frontmatter: { topic: string } }>): string[] {
  return [...new Set(posts.map((p) => p.frontmatter.topic))].sort()
}
