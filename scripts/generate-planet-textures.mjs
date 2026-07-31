/**
 * Bakes every texture the scene needs into public/textures/ as WebP:
 *   <planet>-albedo.webp   surface color (sRGB)
 *   <planet>-normal.webp   tangent-space normal map from the height field
 *   <planet>-emissive.webp night-side glow (city grids, filaments, aurora)
 *   clouds.webp            shared cloud alpha layer
 *   sky.webp               nebula + galaxy backdrop (equirect skysphere)
 *
 * Deterministic per-planet seeds — rerunning produces identical files.
 * Run: npm run gen:textures  (only needed when changing this script)
 */
import { createNoise3D } from 'simplex-noise'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.join(process.cwd(), 'public', 'textures')
const W = 2048
const H = 1024

// --- deterministic RNG -------------------------------------------------------
function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// --- math helpers ------------------------------------------------------------
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (e0, e1, v) => {
  const t = clamp01((v - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

function dirAt(x, y) {
  const lat = ((0.5 - (y + 0.5) / H) * Math.PI)
  const lng = (((x + 0.5) / W) * 2 - 1) * Math.PI
  const c = Math.cos(lat)
  return [c * Math.cos(lng), Math.sin(lat), c * Math.sin(lng)]
}

function makeFbm(seed) {
  const noise = createNoise3D(mulberry32(seed))
  return (x, y, z, octaves = 5, lacunarity = 2.05, gain = 0.5) => {
    let value = 0
    let amp = 0.55
    let f = 1
    for (let i = 0; i < octaves; i += 1) {
      value += amp * noise(x * f, y * f, z * f)
      f *= lacunarity
      amp *= gain
    }
    return value
  }
}

// --- output ------------------------------------------------------------------
async function saveWebp(name, rgb, width, height, quality) {
  await sharp(Buffer.from(rgb.buffer), { raw: { width, height, channels: 3 } })
    .webp({ quality })
    .toFile(path.join(OUT_DIR, name))
  console.log(`  wrote ${name}`)
}

function normalMapFromHeight(height, strength) {
  const rgb = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y += 1) {
    const yUp = Math.max(0, y - 1)
    const yDn = Math.min(H - 1, y + 1)
    for (let x = 0; x < W; x += 1) {
      const xL = (x - 1 + W) % W
      const xR = (x + 1) % W
      const dhdx = (height[y * W + xR] - height[y * W + xL]) * strength
      const dhdy = (height[yDn * W + x] - height[yUp * W + x]) * strength
      const len = Math.hypot(dhdx, dhdy, 1)
      const i = (y * W + x) * 3
      rgb[i] = Math.round(((-dhdx / len) * 0.5 + 0.5) * 255)
      rgb[i + 1] = Math.round(((-dhdy / len) * 0.5 + 0.5) * 255)
      rgb[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255)
    }
  }
  return rgb
}

// --- planet recipes ----------------------------------------------------------
// Each returns { albedo, height, emissive } arrays.

function bakeEducation() {
  const fbm = makeFbm(101)
  const warpF = makeFbm(102)
  const deep = hexToRgb('#0d1f42')
  const mid = hexToRgb('#3a6fc4')
  const high = hexToRgb('#9ec8ff')
  const cap = hexToRgb('#e8f2ff')
  const albedo = new Uint8Array(W * H * 3)
  const height = new Float32Array(W * H)
  const emissive = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const [dx, dy, dz] = dirAt(x, y)
      const warp = warpF(dx * 1.6, dy * 1.6, dz * 1.6, 4)
      // Banded gas giant: latitude bands sheared by turbulence
      const band = Math.sin(dy * 9 + warp * 2.4 + fbm(dx * 3, dy * 3, dz * 3, 3) * 1.2)
      const detail = fbm(dx * 5 + warp, dy * 5, dz * 5 + warp, 5)
      const v = clamp01(0.5 + band * 0.28 + detail * 0.3)
      let rgbPx = mixRgb(deep, mid, smoothstep(0.15, 0.65, v))
      rgbPx = mixRgb(rgbPx, high, smoothstep(0.72, 0.98, v))
      // Polar ice caps
      const polar = smoothstep(0.78, 0.92, Math.abs(dy) + detail * 0.05)
      rgbPx = mixRgb(rgbPx, cap, polar)
      const i = (y * W + x) * 3
      albedo[i] = rgbPx[0]; albedo[i + 1] = rgbPx[1]; albedo[i + 2] = rgbPx[2]
      height[y * W + x] = v * 0.4 + polar * 0.2
      // Faint aurora rings near the poles
      const auroraBand = Math.exp(-((Math.abs(dy) - 0.82) ** 2) / 0.004)
      const aurora = auroraBand * clamp01(0.5 + fbm(dx * 6, dy * 6, dz * 6, 3)) * 90
      emissive[i] = aurora * 0.5; emissive[i + 1] = aurora * 0.8; emissive[i + 2] = aurora
    }
  }
  return { albedo, height, emissive, normalStrength: 6 }
}

function bakeProfessional() {
  const fbm = makeFbm(201)
  const cityF = makeFbm(202)
  const clusterF = makeFbm(203)
  const ocean = hexToRgb('#1a0f06')
  const lowland = hexToRgb('#7a4a14')
  const upland = hexToRgb('#c98a2e')
  const peak = hexToRgb('#f5d9a0')
  const albedo = new Uint8Array(W * H * 3)
  const height = new Float32Array(W * H)
  const emissive = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const [dx, dy, dz] = dirAt(x, y)
      // Ridged continents
      const base = fbm(dx * 2.2, dy * 2.2, dz * 2.2, 5)
      const ridge = 1 - Math.abs(fbm(dx * 3.6, dy * 3.6, dz * 3.6, 4))
      const elevation = base * 0.55 + ridge * 0.6 - 0.28
      const land = smoothstep(0.0, 0.08, elevation)
      const relief = clamp01(elevation)
      let rgbPx = mixRgb(ocean, lowland, land)
      rgbPx = mixRgb(rgbPx, upland, smoothstep(0.18, 0.5, relief) * land)
      rgbPx = mixRgb(rgbPx, peak, smoothstep(0.55, 0.85, relief) * land)
      const i = (y * W + x) * 3
      albedo[i] = rgbPx[0]; albedo[i + 1] = rgbPx[1]; albedo[i + 2] = rgbPx[2]
      height[y * W + x] = relief * land
      // City lights: bright metro cores with sprawling dimmer webs on flat land
      const flat = 1 - smoothstep(0.3, 0.6, relief)
      const cluster = smoothstep(-0.1, 0.6, clusterF(dx * 4.5, dy * 4.5, dz * 4.5, 3))
      const web = smoothstep(0.1, 0.8, Math.abs(cityF(dx * 26, dy * 26, dz * 26, 3)))
      const sparkle = smoothstep(0.45, 0.85, cityF(dx * 60 + 11, dy * 60, dz * 60, 2))
      const habitable = land * flat
      const lights = habitable * cluster * Math.min(1, web * 0.55 + sparkle * 1.2 + 0.06) * 300
      emissive[i] = Math.min(255, lights)
      emissive[i + 1] = Math.min(255, lights * 0.7)
      emissive[i + 2] = Math.min(255, lights * 0.32)
    }
  }
  return { albedo, height, emissive, normalStrength: 14 }
}

function bakeHobbies() {
  const fbm = makeFbm(301)
  const warpF = makeFbm(302)
  const deep = hexToRgb('#04241c')
  const mid = hexToRgb('#0f8f6b')
  const bright = hexToRgb('#5cf0c0')
  const storm = hexToRgb('#eafff5')
  const albedo = new Uint8Array(W * H * 3)
  const height = new Float32Array(W * H)
  const emissive = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const [dx, dy, dz] = dirAt(x, y)
      // Heavy domain warp → churning storm bands
      const w1 = warpF(dx * 2.4, dy * 2.4, dz * 2.4, 4)
      const w2 = warpF(dz * 2.4 + 7.7, dx * 2.4, dy * 2.4, 4)
      const n = fbm(dx * 3.4 + w1 * 1.4, dy * 3.4 + w2 * 1.4, dz * 3.4, 5)
      const v = clamp01(0.5 + n * 0.62)
      let rgbPx = mixRgb(deep, mid, smoothstep(0.2, 0.62, v))
      rgbPx = mixRgb(rgbPx, bright, smoothstep(0.66, 0.9, v))
      rgbPx = mixRgb(rgbPx, storm, smoothstep(0.93, 1.0, v))
      const i = (y * W + x) * 3
      albedo[i] = rgbPx[0]; albedo[i + 1] = rgbPx[1]; albedo[i + 2] = rgbPx[2]
      height[y * W + x] = v * 0.5
      const glow = smoothstep(0.9, 1.0, v) * 70
      emissive[i] = glow * 0.5; emissive[i + 1] = glow; emissive[i + 2] = glow * 0.85
    }
  }
  return { albedo, height, emissive, normalStrength: 8 }
}

function bakeBlog() {
  const fbm = makeFbm(401)
  const filF = makeFbm(402)
  const deep = hexToRgb('#160b30')
  const mid = hexToRgb('#553194')
  const high = hexToRgb('#a879ff')
  const albedo = new Uint8Array(W * H * 3)
  const height = new Float32Array(W * H)
  const emissive = new Uint8Array(W * H * 3)
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const [dx, dy, dz] = dirAt(x, y)
      const marble = fbm(dx * 2.8, dy * 2.8, dz * 2.8, 5)
      const v = clamp01(0.5 + marble * 0.55)
      let rgbPx = mixRgb(deep, mid, smoothstep(0.2, 0.7, v))
      rgbPx = mixRgb(rgbPx, high, smoothstep(0.75, 0.98, v))
      const i = (y * W + x) * 3
      albedo[i] = rgbPx[0]; albedo[i + 1] = rgbPx[1]; albedo[i + 2] = rgbPx[2]
      height[y * W + x] = v * 0.35
      // Signal filaments: thin ridged-noise lines wrapping the surface
      const fil = 1 - Math.abs(filF(dx * 3.2, dy * 3.2, dz * 3.2, 4))
      const filament = smoothstep(0.965, 1.0, fil) * 235
      emissive[i] = filament * 0.75; emissive[i + 1] = filament * 0.45; emissive[i + 2] = filament
    }
  }
  return { albedo, height, emissive, normalStrength: 5 }
}

// --- shared layers -----------------------------------------------------------
async function bakeClouds() {
  const CW = 1024
  const CH = 512
  const fbm = makeFbm(501)
  const rgb = new Uint8Array(CW * CH * 3)
  for (let y = 0; y < CH; y += 1) {
    for (let x = 0; x < CW; x += 1) {
      const lat = (0.5 - (y + 0.5) / CH) * Math.PI
      const lng = (((x + 0.5) / CW) * 2 - 1) * Math.PI
      const c = Math.cos(lat)
      const dx = c * Math.cos(lng)
      const dy = Math.sin(lat)
      const dz = c * Math.sin(lng)
      const billow = Math.abs(fbm(dx * 3, dy * 3, dz * 3, 5))
      const wisp = fbm(dx * 7 + 3.1, dy * 7, dz * 7, 3) * 0.25
      const v = clamp01(smoothstep(0.12, 0.75, billow + wisp)) * 255
      const i = (y * CW + x) * 3
      rgb[i] = v; rgb[i + 1] = v; rgb[i + 2] = v
    }
  }
  await saveWebp('clouds.webp', rgb, CW, CH, 85)
}

async function bakeSky() {
  const fbm = makeFbm(601)
  const rand = mulberry32(602)
  const rgbF = new Float32Array(W * H * 3)
  const lobes = [
    { dir: [-0.5, 0.25, -0.82], color: [64, 34, 128], size: 0.55, freq: 3.2 },
    { dir: [0.75, -0.2, 0.63], color: [16, 84, 96], size: 0.5, freq: 2.6 },
    { dir: [0.15, 0.75, -0.64], color: [96, 26, 58], size: 0.32, freq: 4.0 },
  ]
  for (const lobe of lobes) {
    const len = Math.hypot(...lobe.dir)
    lobe.dir = lobe.dir.map((v) => v / len)
  }
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const d = dirAt(x, y)
      const i = (y * W + x) * 3
      // Base void with a hint of blue depth
      rgbF[i] += 6; rgbF[i + 1] += 8; rgbF[i + 2] += 14
      for (const lobe of lobes) {
        const cos = d[0] * lobe.dir[0] + d[1] * lobe.dir[1] + d[2] * lobe.dir[2]
        const angle = Math.acos(Math.max(-1, Math.min(1, cos)))
        const falloff = Math.exp(-((angle / lobe.size) ** 2))
        if (falloff < 0.01) continue
        const tex = clamp01(0.45 + fbm(d[0] * lobe.freq, d[1] * lobe.freq, d[2] * lobe.freq, 4) * 0.75)
        const strength = falloff * tex
        rgbF[i] += lobe.color[0] * strength
        rgbF[i + 1] += lobe.color[1] * strength
        rgbF[i + 2] += lobe.color[2] * strength
      }
    }
  }
  // Distant star dust
  for (let s = 0; s < 9000; s += 1) {
    const x = Math.floor(rand() * W)
    const y = Math.floor(rand() * H)
    const b = 30 + rand() * 120
    const i = (y * W + x) * 3
    const warm = rand()
    rgbF[i] += b * (0.85 + warm * 0.15)
    rgbF[i + 1] += b * 0.9
    rgbF[i + 2] += b * (1.05 - warm * 0.15)
  }
  // Two soft distant galaxies: tilted elliptical gradients with bright cores
  const galaxies = [
    { cx: 0.22 * W, cy: 0.3 * H, a: 60, b: 18, angle: 0.6, color: [190, 170, 220] },
    { cx: 0.78 * W, cy: 0.66 * H, a: 44, b: 13, angle: -0.4, color: [170, 195, 225] },
  ]
  for (const g of galaxies) {
    const cosA = Math.cos(g.angle)
    const sinA = Math.sin(g.angle)
    for (let dy = -g.a * 2; dy <= g.a * 2; dy += 1) {
      for (let dx = -g.a * 2; dx <= g.a * 2; dx += 1) {
        const u = (dx * cosA + dy * sinA) / g.a
        const v = (-dx * sinA + dy * cosA) / g.b
        const r2 = u * u + v * v
        if (r2 > 4) continue
        const glow = Math.exp(-r2 * 1.6) * 0.9 + Math.exp(-r2 * 14) * 1.4
        const x = Math.round(g.cx + dx)
        const y = Math.round(g.cy + dy)
        if (x < 0 || x >= W || y < 0 || y >= H) continue
        const i = (y * W + x) * 3
        rgbF[i] += g.color[0] * glow * 0.35
        rgbF[i + 1] += g.color[1] * glow * 0.35
        rgbF[i + 2] += g.color[2] * glow * 0.35
      }
    }
  }
  const rgb = new Uint8Array(W * H * 3)
  for (let i = 0; i < rgb.length; i += 1) rgb[i] = Math.min(255, Math.round(rgbF[i]))
  await saveWebp('sky.webp', rgb, W, H, 82)
}

// --- main --------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true })
const planets = {
  education: bakeEducation,
  professional: bakeProfessional,
  hobbies: bakeHobbies,
  blog: bakeBlog,
}
for (const [slug, bake] of Object.entries(planets)) {
  console.log(`baking ${slug}…`)
  const { albedo, height, emissive, normalStrength } = bake()
  await saveWebp(`${slug}-albedo.webp`, albedo, W, H, 82)
  await saveWebp(`${slug}-normal.webp`, normalMapFromHeight(height, normalStrength), W, H, 75)
  await saveWebp(`${slug}-emissive.webp`, emissive, W, H, 80)
}
console.log('baking clouds…')
await bakeClouds()
console.log('baking sky…')
await bakeSky()
console.log('done.')
