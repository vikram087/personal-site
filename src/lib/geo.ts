function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function slugToLatLng(slug: string): { lat: number; lng: number } {
  const h = fnv1a(slug)
  const lat = ((h & 0xffff) / 0xffff) * 100 - 50
  const lng = (((h >>> 16) & 0xffff) / 0x10000) * 360 - 180
  return { lat, lng }
}

/**
 * Display longitude for the i-th of `count` city markers, spread evenly across
 * the camera-facing hemisphere. The destination camera looks at the planet from
 * +Z, which latLngToVector3 maps to lng = -90; markers fan out around it (max
 * spread 120°) so every marker is visible at once regardless of how the planet
 * surface rotates beneath them.
 */
export function frontHemisphereLng(index: number, count: number): number {
  const CENTER = -90
  if (count <= 1) return CENTER
  const spacing = Math.min(45, 120 / (count - 1))
  const span = spacing * (count - 1)
  return CENTER - span / 2 + index * spacing
}

export function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}
