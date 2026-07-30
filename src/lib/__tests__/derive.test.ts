import { describe, it, expect } from 'vitest'
import { deriveTopics } from '@/lib/derive'

describe('deriveTopics', () => {
  it('returns unique topics sorted alphabetically', () => {
    const posts = [
      { frontmatter: { topic: 'dev' } },
      { frontmatter: { topic: 'life' } },
      { frontmatter: { topic: 'dev' } },
    ]
    expect(deriveTopics(posts)).toEqual(['dev', 'life'])
  })
  it('returns [] for no posts', () => {
    expect(deriveTopics([])).toEqual([])
  })
})
