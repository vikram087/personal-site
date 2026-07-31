import { DESTINATIONS } from '@/config/destinations'

/**
 * Every texture the starmap scene needs on first render. Shared between the
 * early warm-up in SceneRoot (starts downloads while the scene JS chunk is
 * still in flight) and the drei preload in SceneCanvas (feeds the loader
 * cache so destination views never pop in behind Suspense).
 */
export const SCENE_TEXTURE_URLS: readonly string[] = [
  ...DESTINATIONS.filter((d) => d.kind === 'planet').flatMap((d) => [
    `/textures/${d.slug}-albedo.webp`,
    `/textures/${d.slug}-normal.webp`,
    `/textures/${d.slug}-emissive.webp`,
  ]),
  '/textures/clouds.webp',
  '/textures/sky.webp',
]

/**
 * Warm the browser HTTP cache for all scene textures. THREE's ImageLoader
 * fetches through <img>, so plain Image() requests here populate the same
 * cache and the later texture loads become cache hits.
 */
export function warmSceneTextures(): void {
  SCENE_TEXTURE_URLS.forEach((url) => {
    const img = new Image()
    img.src = url
  })
}
