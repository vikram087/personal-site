import { describe, it, expect } from 'vitest'
import { parseRoute } from '@/lib/nav'

const planets = ['education', 'professional', 'hobbies', 'blog', 'tower']

describe('parseRoute', () => {
  it('maps / to director', () => {
    expect(parseRoute('/', planets)).toEqual({ view: 'director' })
  })
  it('maps /professional to destination view', () => {
    expect(parseRoute('/professional', planets)).toEqual({ view: 'destination', planet: 'professional' })
  })
  it('maps /professional/work to city view', () => {
    expect(parseRoute('/professional/work', planets)).toEqual({ view: 'city', planet: 'professional', city: 'work' })
  })
  it('maps blog post routes with post slug', () => {
    expect(parseRoute('/blog/dev/first-post', planets)).toEqual({ view: 'city', planet: 'blog', city: 'dev', post: 'first-post' })
  })
  it('falls back to director for unknown or reserved paths', () => {
    expect(parseRoute('/destinations', planets)).toEqual({ view: 'director' })
    expect(parseRoute('/nope', planets)).toEqual({ view: 'director' })
  })
})
