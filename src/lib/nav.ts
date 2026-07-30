export type SceneTarget =
  | { view: 'director' }
  | { view: 'destination'; planet: string }
  | { view: 'city'; planet: string; city: string; post?: string }

export function parseRoute(pathname: string, planetSlugs: string[]): SceneTarget {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return { view: 'director' }
  const [planet, city, post] = parts
  if (!planetSlugs.includes(planet)) return { view: 'director' }
  if (!city) return { view: 'destination', planet }
  return { view: 'city', planet, city, ...(post ? { post } : {}) }
}
