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

export function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}
