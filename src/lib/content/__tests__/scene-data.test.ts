import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { buildSceneData } from '@/lib/content/scene-data'

const FIXTURES = path.join(__dirname, 'fixtures')

describe('buildSceneData', () => {
  const data = buildSceneData(FIXTURES)

  it('returns one node per destination', () => {
    expect(data.map((d) => d.slug)).toEqual(['education', 'professional', 'hobbies', 'blog', 'tower'])
  })
  it('gives education zero city nodes', () => {
    expect(data.find((d) => d.slug === 'education')?.cityNodes).toEqual([])
  })
  it('derives hobby cities from content files with deterministic markers', () => {
    const hobbies = data.find((d) => d.slug === 'hobbies')!
    expect(hobbies.cityNodes.map((c) => c.slug).sort()).toEqual(['skiing', 'tennis'])
    const tennis = hobbies.cityNodes.find((c) => c.slug === 'tennis')!
    expect(tennis.href).toBe('/hobbies/tennis')
    expect(tennis.lat).toBeGreaterThanOrEqual(-50)
    expect(tennis.lat).toBeLessThanOrEqual(50)
  })
  it('derives blog topic cities from post topics', () => {
    const blog = data.find((d) => d.slug === 'blog')!
    expect(blog.cityNodes.map((c) => c.slug)).toEqual(['dev', 'life'])
    expect(blog.cityNodes[0].href).toBe('/blog/dev')
  })
  it('builds static professional cities with hrefs', () => {
    const pro = data.find((d) => d.slug === 'professional')!
    expect(pro.cityNodes.map((c) => c.href)).toEqual([
      '/professional/work',
      '/professional/ventures',
      '/professional/projects',
    ])
  })
})
