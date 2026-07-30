import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { loadCollection, loadPage } from '@/lib/content/loader'
import { hobbyFrontmatter } from '@/lib/content/schemas'

const FIXTURES = path.join(__dirname, 'fixtures')

describe('loadCollection', () => {
  it('loads entries sorted by date desc, excluding drafts', () => {
    const entries = loadCollection('hobbies', hobbyFrontmatter, FIXTURES)
    expect(entries.map((e) => e.slug)).toEqual(['skiing', 'tennis'])
    expect(entries[0].frontmatter.title).toBe('Skiing')
    expect(entries[1].body).toContain('tennis most weekends')
  })
  it('returns [] for a missing directory', () => {
    expect(loadCollection('nope', hobbyFrontmatter, FIXTURES)).toEqual([])
  })
  it('throws naming the offending file on invalid frontmatter', () => {
    expect(() => loadCollection('broken', hobbyFrontmatter, FIXTURES)).toThrow(/broken\/bad\.mdx/)
  })
})

describe('loadPage', () => {
  it('loads a single page file', () => {
    const page = loadPage('about', FIXTURES)
    expect(page.frontmatter.title).toBe('About')
    expect(page.body).toContain('Vikram')
  })
})
