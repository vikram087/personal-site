import { describe, it, expect } from 'vitest'
import {
  baseFrontmatter,
  blogFrontmatter,
  workFrontmatter,
  projectFrontmatter,
  hobbyFrontmatter,
} from '@/lib/content/schemas'

const valid = { title: 'T', summary: 'S', date: '2026-01-05' }

describe('baseFrontmatter', () => {
  it('parses valid frontmatter and defaults draft to false', () => {
    const r = baseFrontmatter.parse(valid)
    expect(r.title).toBe('T')
    expect(r.draft).toBe(false)
    expect(r.date).toBeInstanceOf(Date)
  })
  it('rejects missing title', () => {
    expect(() => baseFrontmatter.parse({ summary: 'S', date: '2026-01-05' })).toThrow()
  })
})

describe('blogFrontmatter', () => {
  it('requires topic', () => {
    expect(() => blogFrontmatter.parse(valid)).toThrow()
    expect(blogFrontmatter.parse({ ...valid, topic: 'dev' }).topic).toBe('dev')
  })
})

describe('workFrontmatter', () => {
  it('requires org, role, period', () => {
    expect(() => workFrontmatter.parse(valid)).toThrow()
    const r = workFrontmatter.parse({ ...valid, org: 'Acme', role: 'SWE', period: '2024–2026' })
    expect(r.org).toBe('Acme')
  })
})

describe('projectFrontmatter', () => {
  it('defaults links to empty object and rejects non-URL links', () => {
    expect(projectFrontmatter.parse(valid).links).toEqual({})
    expect(() => projectFrontmatter.parse({ ...valid, links: { github: 'not-a-url' } })).toThrow()
  })
})

describe('hobbyFrontmatter', () => {
  it('accepts optional marker override within bounds', () => {
    expect(hobbyFrontmatter.parse(valid).marker).toBeUndefined()
    expect(() => hobbyFrontmatter.parse({ ...valid, marker: { lat: 999, lng: 0 } })).toThrow()
    expect(hobbyFrontmatter.parse({ ...valid, marker: { lat: 10, lng: -20 } }).marker).toEqual({ lat: 10, lng: -20 })
  })
})
