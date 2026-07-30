# Starmap Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Destiny 2-style 3D starmap personal site: planets are content categories, city markers are subcategories, and all content opens in in-scene HUD panels.

**Architecture:** Next.js (App Router, static export) with a React Three Fiber scene mounted once in the root layout that never unmounts; the URL is the source of truth and route changes only retarget the camera and toggle DOM panels. MDX content in `content/` is Zod-validated and compiled at build time; a server-side `buildSceneData()` resolves planets + derived cities and passes serializable scene data into the client scene.

**Tech Stack:** Next.js 15, React 19, TypeScript, three + @react-three/fiber 9 + @react-three/drei, @react-three/postprocessing, maath, zustand, framer-motion 12, zod, gray-matter, next-mdx-remote 5, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-29-starmap-personal-site-design.md` — read it before starting.

## Global Constraints

- **Git:** The user handles ALL git operations. NEVER run `git add`/`commit`/`push`. End each task by listing the files created/modified so the user can commit.
- **Static export:** `output: 'export'` in `next.config.ts`. No server runtime, no API routes, no `next/image` optimization (`images.unoptimized: true`).
- **All text is DOM.** Never render text inside WebGL. 3D nameplates use drei `<Html>` (which renders real DOM).
- **Single source of truth for destinations:** planet/city slugs, names, accents, positions live ONLY in `src/config/destinations.ts`. CSS colors live ONLY in `globals.css` tokens. No hex literals elsewhere.
- **Immutability:** never mutate objects/arrays — spread/map/filter to new values. (Exception: three.js objects inside `useFrame`, where mutation is the platform idiom.)
- **File size:** keep files under ~400 lines; split when approaching it. Functions under 50 lines.
- **Validation:** invalid frontmatter must throw at build time, naming the offending file.
- **Coverage:** 80%+ on `src/lib` and `src/config` (enforced in vitest config).
- **Node 20+, npm.** Run everything from repo root.
- **Copy voice:** HUD chrome uses in-fiction sci-fi labels (e.g., "ESTABLISHING TRANSMISSION…") but body content stays plain, readable prose. Buttons say exactly what they do.

## Design System (from frontend-design pass)

**Palette (CSS custom properties, the only place colors are defined besides `destinations.ts` accents):**

| Token | Hex | Role |
|---|---|---|
| `--void` | `#060A12` | Space background |
| `--abyss` | `#0A101C` | Panel surface (used at 85% alpha + blur) |
| `--starlight` | `#E9EDF5` | Primary text & HUD lines |
| `--ghost` | `#7E8AA0` | Secondary text |
| `--line` | `rgba(233,237,245,0.18)` | Hairline borders |

**Destination accents (in `destinations.ts`):** Education `#5B9DFF` · Professional `#F5A83C` · Hobbies `#35E0B2` · Blog `#9F6BFF` · Tower `#C9D4E4`.

**Type:** Chakra Petch 500/600 (display: nameplates, panel titles, HUD labels — uppercase, letter-spacing 0.1em) · IBM Plex Sans 400/500/600 (body prose) · IBM Plex Mono 400/500 (data: dates, coordinates, kickers).

**Signature element — the waypoint nameplate:** a diamond marker plus a bracket-framed label that draws its corners on hover/focus. Used identically for planets, city markers, and panel headers, so the whole site reads as one targeting system.

**Panel anatomy:** translucent `--abyss` surface, `backdrop-filter: blur(12px)`, 1px `--line` border, 12px clipped top-right corner (`clip-path`), 2px accent bar on the left edge in the destination's color.

**Motion:** camera flights ~1.5s eased; panels slide 48px with `cubic-bezier(0.22,1,0.36,1)` over 0.35s; all replaced by fades under reduced motion.

**Anti-generic check (documented so implementers don't "fix" it):** dark background is the brief (literal space), not the AI-dark-mode default; there is deliberately no single global accent — each destination owns its color, HUD chrome stays white-line like Destiny; body type is IBM Plex, not Inter; the one aesthetic risk is committing to the full targeting-reticle nameplate system everywhere.

## File Structure

```
src/
  app/
    layout.tsx                  # fonts, loads scene data + shared panels, mounts SceneRoot
    page.tsx                    # Director (no panel)
    globals.css                 # tokens + base styles + panel/nameplate CSS
    fonts.ts
    [planet]/page.tsx           # destination view (education auto-opens panel)
    [planet]/[city]/page.tsx    # city panels (professional/hobbies/blog topics/tower feed)
    blog/[topic]/[slug]/page.tsx# post reading panel
    destinations/page.tsx       # escape-hatch text index (also WebGL fallback target)
  components/
    scene/
      SceneRoot.tsx             # client bridge: canvas + HUD chrome + panel slot
      SceneCanvas.tsx           # <Canvas>, starfield, planets, rig (lazy-loaded)
      Starfield.tsx
      Planet.tsx
      PlanetMaterial.ts         # GLSL shader material
      TowerStation.tsx
      CityMarker.tsx
      CameraRig.tsx
      SceneErrorBoundary.tsx
    hud/
      HudChrome.tsx             # emblem / transmission / index buttons + their panels
      Panel.tsx                 # sci-fi panel frame (motion)
      Nameplate.tsx             # waypoint nameplate (DOM, used via drei Html)
      LoadingScreen.tsx
      ComingSoonPanel.tsx
    panels/
      EntryListPanel.tsx        # professional cities
      HobbyPanel.tsx
      BlogTopicPanel.tsx
      PostPanel.tsx
      EducationPanel.tsx
      Mdx.tsx                   # next-mdx-remote wrapper
  config/
    destinations.ts
  lib/
    nav.ts                      # parseRoute
    store.ts                    # zustand transient scene state
    geo.ts                      # slugToLatLng, latLngToVector3
    derive.ts                   # deriveTopics
    device-tier.ts
    content/
      schemas.ts
      loader.ts
      scene-data.ts             # buildSceneData()
content/
  education/  professional/{work,ventures,projects}/  hobbies/  blog/
  about.mdx  now.mdx  uses.mdx  contact.mdx
tests/e2e/*.spec.ts
```

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (minimal versions; later tasks flesh them out)
- Test: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npm run dev|build|test|test:e2e` scripts; `@/*` path alias; static-export Next app that builds clean.

- [ ] **Step 1: Write config files**

`package.json`:

```json
{
  "name": "personal-site",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@react-three/drei": "^10.0.0",
    "@react-three/fiber": "^9.0.0",
    "@react-three/postprocessing": "^3.0.0",
    "framer-motion": "^12.0.0",
    "gray-matter": "^4.0.3",
    "maath": "^0.10.8",
    "next": "^15.3.0",
    "next-mdx-remote": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.175.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.175.0",
    "@vitejs/plugin-react": "^4.4.0",
    "@vitest/coverage-v8": "^3.1.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

export default nextConfig
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/config/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

`.gitignore`:

```
node_modules/
.next/
out/
coverage/
playwright-report/
test-results/
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 2: Write minimal app shell**

`src/app/globals.css` (replaced in Task 2 — minimal for now):

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```

`src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Vikram Penumarti', description: 'Personal starmap' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:

```tsx
export default function DirectorPage() {
  return <main>Starmap coming online.</main>
}
```

- [ ] **Step 3: Write smoke test** — `src/lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Install and verify**

Run: `npm install`, then `npx playwright install chromium`, then `npm test` (expect PASS), then `npm run build` (expect success, `out/` created).

- [ ] **Step 5: Report** — list created files for the user to commit. Do not run git.

---

### Task 2: Design tokens & global styles

**Files:**
- Create: `src/app/fonts.ts`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties (`--void`, `--abyss`, `--starlight`, `--ghost`, `--line`), font variables (`--font-display`, `--font-body`, `--font-mono`), utility classes `.nameplate`, `.panel`, `.kicker`, `.hud-button` used by every later UI task.

- [ ] **Step 1: Fonts** — `src/app/fonts.ts`:

```ts
import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'

export const display = Chakra_Petch({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-display',
})

export const body = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
})

export const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})
```

- [ ] **Step 2: Global CSS** — replace `src/app/globals.css`:

```css
:root {
  --void: #060A12;
  --abyss: #0A101C;
  --starlight: #E9EDF5;
  --ghost: #7E8AA0;
  --line: rgba(233, 237, 245, 0.18);
  --panel-width: min(45vw, 640px);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body { height: 100%; }

body {
  background: var(--void);
  color: var(--starlight);
  font-family: var(--font-body), system-ui, sans-serif;
  overflow: hidden;
}

h1, h2, h3, .display {
  font-family: var(--font-display), sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.kicker {
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ghost);
}

/* Signature: waypoint nameplate — bracket corners draw on hover/focus */
.nameplate {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 14px;
  font-family: var(--font-display), sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
  color: var(--starlight);
  background: transparent;
  border: none;
  cursor: pointer;
}
.nameplate::before, .nameplate::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--accent, var(--starlight));
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.2s ease;
}
.nameplate::before { top: 0; left: 0; border-right: 0; border-bottom: 0; transform: translate(4px, 4px); }
.nameplate::after { bottom: 0; right: 0; border-left: 0; border-top: 0; transform: translate(-4px, -4px); }
.nameplate:hover::before, .nameplate:focus-visible::before,
.nameplate:hover::after, .nameplate:focus-visible::after {
  opacity: 1;
  transform: translate(0, 0);
}
.nameplate .descriptor {
  font-family: var(--font-mono), monospace;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  color: var(--ghost);
  text-transform: none;
}

/* Panel frame */
.panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: var(--panel-width);
  background: color-mix(in srgb, var(--abyss) 85%, transparent);
  backdrop-filter: blur(12px);
  border-left: 1px solid var(--line);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  box-shadow: inset 2px 0 0 var(--accent, var(--starlight));
  display: flex;
  flex-direction: column;
  z-index: 20;
}
.panel-header { padding: 28px 32px 16px; border-bottom: 1px solid var(--line); }
.panel-body {
  padding: 24px 32px 48px;
  overflow-y: auto;
  flex: 1;
  font-size: 1rem;
  line-height: 1.7;
}
.panel-body p { margin-bottom: 1em; max-width: 62ch; }
.panel-body a { color: var(--accent, var(--starlight)); }

.hud-button {
  pointer-events: auto;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--starlight);
  font-family: var(--font-mono), monospace;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 8px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.hud-button:hover, .hud-button:focus-visible { border-color: var(--starlight); }

:focus-visible { outline: 1px solid var(--starlight); outline-offset: 3px; }

@media (max-width: 768px) {
  :root { --panel-width: 100vw; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Wire fonts into layout** — modify `src/app/layout.tsx` body tag:

```tsx
import { display, body, mono } from './fonts'
// ...
<body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body>
```

- [ ] **Step 4: Verify** — `npm run build` succeeds; `npm run dev`, open http://localhost:3000, confirm dark background and font variables in devtools.

- [ ] **Step 5: Report changed files.**

---

### Task 3: Content frontmatter schemas (TDD)

**Files:**
- Create: `src/lib/content/schemas.ts`
- Test: `src/lib/content/__tests__/schemas.test.ts`

**Interfaces:**
- Produces: `baseFrontmatter`, `blogFrontmatter`, `workFrontmatter`, `projectFrontmatter`, `hobbyFrontmatter`, `pageFrontmatter` (Zod schemas) and inferred types `BlogFrontmatter`, `WorkFrontmatter`, `ProjectFrontmatter`, `HobbyFrontmatter`, `BaseFrontmatter`, `PageFrontmatter`.

- [ ] **Step 1: Write failing tests** — `src/lib/content/__tests__/schemas.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/lib/content/schemas.ts`:

```ts
import { z } from 'zod'

export const baseFrontmatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
})

export const blogFrontmatter = baseFrontmatter.extend({
  topic: z.string().min(1),
})

export const workFrontmatter = baseFrontmatter.extend({
  org: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
})

export const projectFrontmatter = baseFrontmatter.extend({
  links: z.record(z.string(), z.string().url()).default({}),
})

export const hobbyFrontmatter = baseFrontmatter.extend({
  marker: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
})

export const pageFrontmatter = z.object({
  title: z.string().min(1),
})

export type BaseFrontmatter = z.infer<typeof baseFrontmatter>
export type BlogFrontmatter = z.infer<typeof blogFrontmatter>
export type WorkFrontmatter = z.infer<typeof workFrontmatter>
export type ProjectFrontmatter = z.infer<typeof projectFrontmatter>
export type HobbyFrontmatter = z.infer<typeof hobbyFrontmatter>
export type PageFrontmatter = z.infer<typeof pageFrontmatter>
```

- [ ] **Step 4: Run to verify pass** — `npm test` → PASS.

- [ ] **Step 5: Report changed files.**

---

### Task 4: Content loader (TDD)

**Files:**
- Create: `src/lib/content/loader.ts`, fixtures under `src/lib/content/__tests__/fixtures/`
- Test: `src/lib/content/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: schemas from Task 3.
- Produces: `type Entry<T> = { slug: string; frontmatter: T; body: string }`; `loadCollection<T>(dir: string, schema: ZodType<T>, root?: string): Entry<T>[]` (sorted date desc, drafts excluded, throws naming bad file); `loadPage(name: string, root?: string): { frontmatter: PageFrontmatter; body: string }`.

- [ ] **Step 1: Create fixtures**

`src/lib/content/__tests__/fixtures/hobbies/tennis.mdx`:

```mdx
---
title: Tennis
summary: Chasing the perfect forehand.
date: 2026-01-10
---

I play tennis most weekends.
```

`src/lib/content/__tests__/fixtures/hobbies/drafted.mdx`:

```mdx
---
title: Draft Hobby
summary: Not ready.
date: 2026-02-01
draft: true
---

Unfinished.
```

`src/lib/content/__tests__/fixtures/hobbies/skiing.mdx`:

```mdx
---
title: Skiing
summary: Winter obsession.
date: 2026-03-01
---

Fresh powder.
```

`src/lib/content/__tests__/fixtures/broken/bad.mdx`:

```mdx
---
summary: Missing title.
date: 2026-01-01
---

Body.
```

`src/lib/content/__tests__/fixtures/about.mdx`:

```mdx
---
title: About
---

Hello, I am Vikram.
```

- [ ] **Step 2: Write failing tests** — `src/lib/content/__tests__/loader.test.ts`:

```ts
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
```

- [ ] **Step 3: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 4: Implement** — `src/lib/content/loader.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { ZodType } from 'zod'
import { pageFrontmatter, type PageFrontmatter } from '@/lib/content/schemas'

export type Entry<T> = { slug: string; frontmatter: T; body: string }

const defaultRoot = () => path.join(process.cwd(), 'content')

function parseFile<T>(filePath: string, label: string, schema: ZodType<T>): { frontmatter: T; body: string } {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${label}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
  }
  return { frontmatter: parsed.data, body: content.trim() }
}

export function loadCollection<T extends { date: Date; draft: boolean }>(
  dir: string,
  schema: ZodType<T>,
  root: string = defaultRoot(),
): Entry<T>[] {
  const collectionDir = path.join(root, dir)
  if (!fs.existsSync(collectionDir)) return []
  return fs
    .readdirSync(collectionDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ''),
      ...parseFile(path.join(collectionDir, file), `${dir}/${file}`, schema),
    }))
    .filter((e) => !e.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime())
}

export function loadPage(name: string, root: string = defaultRoot()): { frontmatter: PageFrontmatter; body: string } {
  return parseFile(path.join(root, `${name}.mdx`), `${name}.mdx`, pageFrontmatter)
}
```

- [ ] **Step 5: Run to verify pass** — `npm test` → PASS.

- [ ] **Step 6: Report changed files.**

### Task 5: Derivation & geometry utils (TDD)

**Files:**
- Create: `src/lib/derive.ts`, `src/lib/geo.ts`
- Test: `src/lib/__tests__/derive.test.ts`, `src/lib/__tests__/geo.test.ts`

**Interfaces:**
- Produces: `deriveTopics(posts: { frontmatter: { topic: string } }[]): string[]` (unique, sorted); `slugToLatLng(slug: string): { lat: number; lng: number }` (deterministic, lat ∈ [-50, 50], lng ∈ [-180, 180)); `latLngToVector3(lat: number, lng: number, radius: number): [number, number, number]`.

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/derive.test.ts`:

```ts
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
```

`src/lib/__tests__/geo.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugToLatLng, latLngToVector3 } from '@/lib/geo'

describe('slugToLatLng', () => {
  it('is deterministic', () => {
    expect(slugToLatLng('tennis')).toEqual(slugToLatLng('tennis'))
  })
  it('differs across slugs', () => {
    expect(slugToLatLng('tennis')).not.toEqual(slugToLatLng('skiing'))
  })
  it('stays within visible bounds', () => {
    for (const slug of ['a', 'work', 'ventures', 'projects', 'long-slug-name']) {
      const { lat, lng } = slugToLatLng(slug)
      expect(lat).toBeGreaterThanOrEqual(-50)
      expect(lat).toBeLessThanOrEqual(50)
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThan(180)
    }
  })
})

describe('latLngToVector3', () => {
  it('maps the north pole to +Y', () => {
    const [x, y, z] = latLngToVector3(90, 0, 2)
    expect(x).toBeCloseTo(0, 5)
    expect(y).toBeCloseTo(2, 5)
    expect(z).toBeCloseTo(0, 5)
  })
  it('keeps points on the sphere surface', () => {
    const [x, y, z] = latLngToVector3(33, -120, 3)
    expect(Math.hypot(x, y, z)).toBeCloseTo(3, 5)
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/derive.ts`:

```ts
export function deriveTopics(posts: ReadonlyArray<{ frontmatter: { topic: string } }>): string[] {
  return [...new Set(posts.map((p) => p.frontmatter.topic))].sort()
}
```

`src/lib/geo.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify pass** — `npm test` → PASS.

- [ ] **Step 5: Report changed files.**

---

### Task 6: Destinations config & scene data (TDD)

**Files:**
- Create: `src/config/destinations.ts`, `src/lib/content/scene-data.ts`
- Test: `src/config/__tests__/destinations.test.ts`, `src/lib/content/__tests__/scene-data.test.ts` (+ fixture dirs `fixtures/blog/`, empty-marker hobby reuse)

**Interfaces:**
- Consumes: loader (Task 4), derive/geo (Task 5), schemas (Task 3).
- Produces:

```ts
// destinations.ts
export type CityDef = { slug: string; name: string; descriptor: string }
export type DestinationDef = {
  slug: string
  name: string
  descriptor: string
  kind: 'planet' | 'station'
  accent: string
  position: [number, number, number]
  cities: CityDef[] | 'derived-hobbies' | 'derived-blog-topics'
  autoOpenPanel?: boolean
}
export const DESTINATIONS: DestinationDef[]
export const PLANET_SLUGS: string[]

// scene-data.ts
export type CityNode = { slug: string; name: string; descriptor: string; lat: number; lng: number; href: string }
export type DestinationNode = Omit<DestinationDef, 'cities'> & { cityNodes: CityNode[] }
export function buildSceneData(root?: string): DestinationNode[]
```

- [ ] **Step 1: Write failing config tests** — `src/config/__tests__/destinations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { DESTINATIONS, PLANET_SLUGS } from '@/config/destinations'

describe('DESTINATIONS', () => {
  it('contains the five destinations from the spec', () => {
    expect(PLANET_SLUGS).toEqual(['education', 'professional', 'hobbies', 'blog', 'tower'])
  })
  it('has unique slugs and positions', () => {
    const slugs = DESTINATIONS.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const positions = DESTINATIONS.map((d) => d.position.join(','))
    expect(new Set(positions).size).toBe(positions.length)
  })
  it('uses valid hex accents', () => {
    for (const d of DESTINATIONS) expect(d.accent).toMatch(/^#[0-9A-F]{6}$/i)
  })
  it('marks education as auto-open with no cities', () => {
    const edu = DESTINATIONS.find((d) => d.slug === 'education')
    expect(edu?.autoOpenPanel).toBe(true)
    expect(edu?.cities).toEqual([])
  })
  it('marks the tower as a station with the feed city', () => {
    const tower = DESTINATIONS.find((d) => d.slug === 'tower')
    expect(tower?.kind).toBe('station')
    expect(tower?.cities).toEqual([
      { slug: 'feed', name: 'Live Feed', descriptor: 'Transmission offline — coming soon' },
    ])
  })
})
```

- [ ] **Step 2: Run to verify failure**, then implement `src/config/destinations.ts`:

```ts
export type CityDef = { slug: string; name: string; descriptor: string }

export type DestinationDef = {
  slug: string
  name: string
  descriptor: string
  kind: 'planet' | 'station'
  accent: string
  position: [number, number, number]
  cities: CityDef[] | 'derived-hobbies' | 'derived-blog-topics'
  autoOpenPanel?: boolean
}

export const DESTINATIONS: DestinationDef[] = [
  {
    slug: 'education',
    name: 'Education',
    descriptor: 'Degrees and certifications',
    kind: 'planet',
    accent: '#5B9DFF',
    position: [-7, 2, -4],
    cities: [],
    autoOpenPanel: true,
  },
  {
    slug: 'professional',
    name: 'Professional',
    descriptor: 'Work, ventures, projects',
    kind: 'planet',
    accent: '#F5A83C',
    position: [5, 1, -8],
    cities: [
      { slug: 'work', name: 'Work', descriptor: 'Roles and employers' },
      { slug: 'ventures', name: 'Personal Ventures', descriptor: 'Things I have started' },
      { slug: 'projects', name: 'Projects', descriptor: 'Built for the joy of it' },
    ],
  },
  {
    slug: 'hobbies',
    name: 'Hobbies',
    descriptor: 'Sports and pursuits',
    kind: 'planet',
    accent: '#35E0B2',
    position: [-2, -3, -11],
    cities: 'derived-hobbies',
  },
  {
    slug: 'blog',
    name: 'Blog',
    descriptor: 'Writing, by topic',
    kind: 'planet',
    accent: '#9F6BFF',
    position: [9, -2, -2],
    cities: 'derived-blog-topics',
  },
  {
    slug: 'tower',
    name: 'The Tower',
    descriptor: 'Home base',
    kind: 'station',
    accent: '#C9D4E4',
    position: [1, 4, -6],
    cities: [{ slug: 'feed', name: 'Live Feed', descriptor: 'Transmission offline — coming soon' }],
  },
]

export const PLANET_SLUGS = DESTINATIONS.map((d) => d.slug)
```

Run: `npm test` → config tests PASS.

- [ ] **Step 3: Add blog fixtures** for scene-data tests:

`src/lib/content/__tests__/fixtures/blog/first-post.mdx`:

```mdx
---
title: First Post
summary: Hello world.
date: 2026-04-01
topic: dev
---

My first post.
```

`src/lib/content/__tests__/fixtures/blog/second-post.mdx`:

```mdx
---
title: Second Post
summary: More words.
date: 2026-05-01
topic: life
---

Another post.
```

- [ ] **Step 4: Write failing scene-data tests** — `src/lib/content/__tests__/scene-data.test.ts`:

```ts
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
```

- [ ] **Step 5: Run to verify failure**, then implement `src/lib/content/scene-data.ts`:

```ts
import { DESTINATIONS, type DestinationDef, type CityDef } from '@/config/destinations'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter, hobbyFrontmatter } from '@/lib/content/schemas'
import { deriveTopics } from '@/lib/derive'
import { slugToLatLng } from '@/lib/geo'

export type CityNode = {
  slug: string
  name: string
  descriptor: string
  lat: number
  lng: number
  href: string
}

export type DestinationNode = Omit<DestinationDef, 'cities'> & { cityNodes: CityNode[] }

function staticCity(planetSlug: string, city: CityDef): CityNode {
  return { ...city, ...slugToLatLng(city.slug), href: `/${planetSlug}/${city.slug}` }
}

function hobbyCities(root?: string): CityNode[] {
  return loadCollection('hobbies', hobbyFrontmatter, root).map((e) => ({
    slug: e.slug,
    name: e.frontmatter.title,
    descriptor: e.frontmatter.summary,
    ...(e.frontmatter.marker ?? slugToLatLng(e.slug)),
    href: `/hobbies/${e.slug}`,
  }))
}

function blogTopicCities(root?: string): CityNode[] {
  const posts = loadCollection('blog', blogFrontmatter, root)
  return deriveTopics(posts).map((topic) => ({
    slug: topic,
    name: topic,
    descriptor: `${posts.filter((p) => p.frontmatter.topic === topic).length} transmissions`,
    ...slugToLatLng(topic),
    href: `/blog/${topic}`,
  }))
}

export function buildSceneData(root?: string): DestinationNode[] {
  return DESTINATIONS.map(({ cities, ...rest }) => ({
    ...rest,
    cityNodes:
      cities === 'derived-hobbies'
        ? hobbyCities(root)
        : cities === 'derived-blog-topics'
          ? blogTopicCities(root)
          : cities.map((c) => staticCity(rest.slug, c)),
  }))
}
```

- [ ] **Step 6: Run to verify pass** — `npm test` → PASS.

- [ ] **Step 7: Report changed files.**

---

### Task 7: Route parsing, app routes & scene store (TDD)

**Files:**
- Create: `src/lib/nav.ts`, `src/lib/store.ts`, `src/app/[planet]/page.tsx`, `src/app/[planet]/[city]/page.tsx`, `src/app/blog/[topic]/[slug]/page.tsx`, `src/app/destinations/page.tsx`, seed `content/` files (Step 5) so the build has data
- Test: `src/lib/__tests__/nav.test.ts`, `src/lib/__tests__/store.test.ts`

**Interfaces:**
- Consumes: `buildSceneData`, `DESTINATIONS`, `PLANET_SLUGS`, loaders.
- Produces:

```ts
// nav.ts
export type SceneTarget =
  | { view: 'director' }
  | { view: 'destination'; planet: string }
  | { view: 'city'; planet: string; city: string; post?: string }
export function parseRoute(pathname: string, planetSlugs: string[]): SceneTarget

// store.ts
export const useSceneStore: zustand store — { hovered: string | null; tier: 'high' | 'low'; reducedMotion: boolean; setHovered; setTier; setReducedMotion }
```

Panels for these routes are placeholder `<div>`s in this task; Task 11 replaces them. Route files themselves are final.

**Routing note:** `/blog/<topic>` is served by `app/[planet]/[city]/page.tsx` (its `generateStaticParams` includes blog topics via `buildSceneData`), while `/blog/<topic>/<slug>` needs the extra depth of `app/blog/[topic]/[slug]/page.tsx`. A static `app/blog/` folder existing WITHOUT its own `page.tsx` does not shadow the dynamic `[planet]` routes — Next falls through to them. Do not add `app/blog/page.tsx` or `app/blog/[topic]/page.tsx`.

- [ ] **Step 1: Write failing nav tests** — `src/lib/__tests__/nav.test.ts`:

```ts
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
```

- [ ] **Step 2: Write failing store tests** — `src/lib/__tests__/store.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { useSceneStore } from '@/lib/store'

describe('useSceneStore', () => {
  it('starts idle on high tier', () => {
    const s = useSceneStore.getState()
    expect(s.hovered).toBeNull()
    expect(s.tier).toBe('high')
    expect(s.reducedMotion).toBe(false)
  })
  it('updates hover and tier immutably', () => {
    useSceneStore.getState().setHovered('blog')
    expect(useSceneStore.getState().hovered).toBe('blog')
    useSceneStore.getState().setTier('low')
    expect(useSceneStore.getState().tier).toBe('low')
    useSceneStore.getState().setHovered(null)
  })
})
```

- [ ] **Step 3: Run to verify failure**, then implement.

`src/lib/nav.ts`:

```ts
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
```

`src/lib/store.ts`:

```ts
import { create } from 'zustand'

type Tier = 'high' | 'low'

type SceneState = {
  hovered: string | null
  tier: Tier
  reducedMotion: boolean
  setHovered: (slug: string | null) => void
  setTier: (tier: Tier) => void
  setReducedMotion: (value: boolean) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  hovered: null,
  tier: 'high',
  reducedMotion: false,
  setHovered: (hovered) => set({ hovered }),
  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}))
```

- [ ] **Step 4: Run to verify pass** — `npm test` → PASS.

- [ ] **Step 5: Seed minimal real content** so static routes exist (user replaces copy later; structure is real):

`content/education/ucdavis.mdx`:

```mdx
---
title: University of California, Davis
summary: B.S. in Computer Science.
date: 2024-06-15
---

Studied computer science at UC Davis.
```

`content/professional/work/first-role.mdx`:

```mdx
---
title: Software Engineer
summary: First role out of school.
date: 2024-07-01
org: Company Name
role: Software Engineer
period: 2024–present
---

What I do in this role.
```

`content/professional/ventures/first-venture.mdx`:

```mdx
---
title: First Venture
summary: A thing I started.
date: 2025-01-01
---

About this venture.
```

`content/professional/projects/this-website.mdx`:

```mdx
---
title: This Website
summary: Colophon — how this site is built.
date: 2026-07-30
links:
  github: https://github.com/vpenumarti/personal-site
---

This site is a Destiny 2-style starmap built with Next.js, React Three Fiber,
custom GLSL planet shaders, and MDX content — statically exported and deployed
on Vercel. Designed and built with Claude Code.
```

`content/hobbies/tennis.mdx`:

```mdx
---
title: Tennis
summary: Weekend rallies.
date: 2026-01-01
---

I play tennis.
```

`content/blog/hello-world.mdx`:

```mdx
---
title: Hello World
summary: The obligatory first post.
date: 2026-07-30
topic: meta
---

Welcome aboard. More transmissions soon.
```

`content/about.mdx`, `content/now.mdx`, `content/uses.mdx`, `content/contact.mdx` (same shape; contact shown):

```mdx
---
title: Contact
---

- Email: [vikram.penumarti@gmail.com](mailto:vikram.penumarti@gmail.com)
- GitHub: [vpenumarti](https://github.com/vpenumarti)
- LinkedIn: [Vikram Penumarti](https://www.linkedin.com/in/vpenumarti)
```

- [ ] **Step 6: Create route files** (placeholder panel bodies, final params logic):

`src/app/[planet]/page.tsx`:

```tsx
import { DESTINATIONS } from '@/config/destinations'

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ planet: d.slug }))
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params
  if (planet === 'education') return <div data-panel="education">Education panel (Task 11)</div>
  return null
}
```

`src/app/[planet]/[city]/page.tsx`:

```tsx
import { buildSceneData } from '@/lib/content/scene-data'

export function generateStaticParams() {
  return buildSceneData()
    .filter((d) => d.slug !== 'education')
    .flatMap((d) => d.cityNodes.map((c) => ({ planet: d.slug, city: c.slug })))
}

export default async function CityPage({ params }: { params: Promise<{ planet: string; city: string }> }) {
  const { planet, city } = await params
  return <div data-panel={`${planet}/${city}`}>City panel (Task 11)</div>
}
```

`src/app/blog/[topic]/[slug]/page.tsx`:

```tsx
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'

export function generateStaticParams() {
  return loadCollection('blog', blogFrontmatter).map((p) => ({ topic: p.frontmatter.topic, slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ topic: string; slug: string }> }) {
  const { slug } = await params
  return <div data-panel={`post/${slug}`}>Post panel (Task 11)</div>
}
```

`src/app/destinations/page.tsx`:

```tsx
import Link from 'next/link'
import { buildSceneData } from '@/lib/content/scene-data'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'

export default function DestinationsPage() {
  const data = buildSceneData()
  const posts = loadCollection('blog', blogFrontmatter)
  return (
    <main className="panel-body" style={{ maxWidth: 720, margin: '0 auto', height: '100dvh' }}>
      <p className="kicker">Destination index</p>
      <h1>All destinations</h1>
      {data.map((d) => (
        <section key={d.slug}>
          <h2 style={{ marginTop: '1.5em' }}>
            <Link href={`/${d.slug}`}>{d.name}</Link>
          </h2>
          <ul>
            {d.cityNodes.map((c) => (
              <li key={c.slug}>
                <Link href={c.href}>{c.name}</Link> — {c.descriptor}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2 style={{ marginTop: '1.5em' }}>All posts</h2>
        <ul>
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.frontmatter.topic}/${p.slug}`}>{p.frontmatter.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

- [ ] **Step 7: Verify build** — `npm run build`: succeeds; `out/` contains `education.html`, `professional/work.html`, `hobbies/tennis.html`, `blog/meta.html`, `blog/meta/hello-world.html`, `tower/feed.html`, `destinations.html`.

- [ ] **Step 8: Report changed files.**

### Task 8: Scene shell — persistent canvas, starfield, loading, fallback, error boundaries

**Files:**
- Create: `src/components/scene/SceneRoot.tsx`, `src/components/scene/SceneCanvas.tsx`, `src/components/scene/Starfield.tsx`, `src/components/scene/SceneErrorBoundary.tsx`, `src/components/hud/LoadingScreen.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `buildSceneData()` (Task 6), `useSceneStore` (Task 7).
- Produces: `<SceneRoot sceneData={DestinationNode[]}>{children}</SceneRoot>` — mounts once in layout; children (route panels) render in an overlay slot. Task 12 later adds an optional `hud?: ReactNode` prop. `SceneCanvas` accepts `{ sceneData: DestinationNode[] }`. Later tasks add planets/rig INSIDE `SceneCanvas`.

- [ ] **Step 1: LoadingScreen** — `src/components/hud/LoadingScreen.tsx`:

```tsx
export function LoadingScreen() {
  return (
    <div
      role="status"
      style={{
        position: 'fixed', inset: 0, display: 'grid', placeContent: 'center',
        background: 'var(--void)', zIndex: 40,
      }}
    >
      <p className="kicker">Establishing transmission…</p>
    </div>
  )
}
```

- [ ] **Step 2: Error boundary** — `src/components/scene/SceneErrorBoundary.tsx`:

```tsx
'use client'
import { Component, type ReactNode } from 'react'

type Props = { fallback: ReactNode; children: ReactNode }
type State = { failed: boolean }

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.error('Scene crashed, falling back to index UI:', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
```

- [ ] **Step 3: Starfield** — `src/components/scene/Starfield.tsx`:

```tsx
'use client'
import { Stars } from '@react-three/drei'
import { useSceneStore } from '@/lib/store'

export function Starfield() {
  const tier = useSceneStore((s) => s.tier)
  return <Stars radius={80} depth={40} count={tier === 'high' ? 4000 : 1200} factor={3} saturation={0} fade speed={0.4} />
}
```

- [ ] **Step 4: SceneCanvas** — `src/components/scene/SceneCanvas.tsx` (planets added in Task 9):

```tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { Starfield } from '@/components/scene/Starfield'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

export default function SceneCanvas({ sceneData }: { sceneData: DestinationNode[] }) {
  const tier = useSceneStore((s) => s.tier)
  return (
    <Canvas
      dpr={tier === 'high' ? [1, 2] : 1}
      camera={{ position: [0, 0, 14], fov: 50 }}
      style={{ position: 'fixed', inset: 0 }}
      aria-hidden
    >
      <color attach="background" args={['#060A12']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 8, 6]} intensity={1.1} />
      <Starfield />
      {/* Task 9: <DestinationField sceneData={sceneData} /> + <CameraRig sceneData={sceneData} /> */}
    </Canvas>
  )
}
```

- [ ] **Step 5: SceneRoot** — `src/components/scene/SceneRoot.tsx`:

```tsx
'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { LoadingScreen } from '@/components/hud/LoadingScreen'
import type { DestinationNode } from '@/lib/content/scene-data'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const fallbackNotice = (
  <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 30 }}>
    <p className="kicker">
      3D unavailable on this device — <Link href="/destinations">browse the destination index</Link>
    </p>
  </div>
)

export function SceneRoot({
  sceneData,
  children,
}: {
  sceneData: DestinationNode[]
  children: ReactNode
}) {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  useEffect(() => setWebgl(webglSupported()), [])

  return (
    <>
      {webgl === null && <LoadingScreen />}
      {webgl === true && (
        <SceneErrorBoundary fallback={fallbackNotice}>
          <Suspense fallback={<LoadingScreen />}>
            <SceneCanvas sceneData={sceneData} />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {webgl === false && fallbackNotice}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>{children}</div>
    </>
  )
}
```

Note: children overlay uses `pointer-events: none`; interactive elements inside panels/HUD re-enable with `pointer-events: auto` (`.panel` and `.hud-button` get it — add `pointer-events: auto;` to `.panel` in `globals.css` now).

- [ ] **Step 6: Mount in layout** — modify `src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { display, body, mono } from './fonts'
import { SceneRoot } from '@/components/scene/SceneRoot'
import { buildSceneData } from '@/lib/content/scene-data'
import './globals.css'

export const metadata = {
  title: 'Vikram Penumarti — Starmap',
  description: 'Personal site: education, work, hobbies, and writing, charted as destinations.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const sceneData = buildSceneData()
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <SceneRoot sceneData={sceneData}>{children}</SceneRoot>
      </body>
    </html>
  )
}
```

Also change `src/app/page.tsx` to return `null` (Director shows scene only).

`/destinations` must stay readable over the scene: wrap its `<main>` in a `<div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20, background: 'var(--void)' }}>`.

- [ ] **Step 7: Verify** — `npm run dev`: starfield renders, loading screen flashes first, no console errors. `npm test` still PASS; `npm run build` succeeds.

- [ ] **Step 8: Report changed files.**

---

### Task 9: Director view — planet shader, planets, nameplates, camera rig

**Files:**
- Create: `src/components/scene/PlanetMaterial.ts`, `src/components/scene/Planet.tsx`, `src/components/scene/CameraRig.tsx`, `src/components/scene/DestinationField.tsx`, `src/components/hud/Nameplate.tsx`
- Modify: `src/components/scene/SceneCanvas.tsx`

**Interfaces:**
- Consumes: `DestinationNode`, `parseRoute`, `useSceneStore`, `.nameplate` CSS.
- Produces: `<DestinationField sceneData />` (all planets + tower, hover/click), `<CameraRig sceneData />` (flies camera per route), `<Nameplate name descriptor accent onSelect />` (DOM button), `PlanetMaterial` (shader with uniforms `uColor: THREE.Color`, `uTime: number`).

- [ ] **Step 1: Shader material** — `src/components/scene/PlanetMaterial.ts`:

```ts
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const PlanetMaterial = shaderMaterial(
  { uColor: new THREE.Color('#5B9DFF'), uTime: 0 },
  /* vertex */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  /* fragment */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    float bands = noise(vPos * 2.5 + vec3(0.0, uTime * 0.04, 0.0));
    bands += 0.5 * noise(vPos * 6.0 + vec3(uTime * 0.02));
    vec3 base = mix(uColor * 0.28, uColor, smoothstep(0.3, 1.1, bands));
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
    gl_FragColor = vec4(base + uColor * fresnel * 0.85, 1.0);
  }`
)
```

- [ ] **Step 2: Nameplate (DOM)** — `src/components/hud/Nameplate.tsx`:

```tsx
'use client'
import type { CSSProperties } from 'react'

export function Nameplate({
  name,
  descriptor,
  accent,
  onSelect,
}: {
  name: string
  descriptor: string
  accent: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className="nameplate"
      style={{ '--accent': accent, pointerEvents: 'auto' } as CSSProperties}
      onClick={onSelect}
    >
      <span>{name}</span>
      <span className="descriptor">{descriptor}</span>
    </button>
  )
}
```

- [ ] **Step 3: Planet component** — `src/components/scene/Planet.tsx`:

```tsx
'use client'
import { useRef, type ReactNode } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { PlanetMaterial } from '@/components/scene/PlanetMaterial'
import { Nameplate } from '@/components/hud/Nameplate'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

extend({ PlanetMaterial })

export function Planet({
  node,
  focused,
  onSelect,
  children,
}: {
  node: DestinationNode
  focused: boolean
  onSelect: () => void
  children?: ReactNode
}) {
  const material = useRef<THREE.ShaderMaterial & { uTime: number }>(null)
  const group = useRef<THREE.Group>(null)
  const setHovered = useSceneStore((s) => s.setHovered)

  useFrame((_, delta) => {
    if (material.current) material.current.uTime += delta
    if (group.current && !focused) group.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={group} position={node.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={() => {
          setHovered(node.slug)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[1.4, 48, 48]} />
        {/* @ts-expect-error extended element */}
        <planetMaterial ref={material} uColor={new THREE.Color(node.accent)} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color={node.accent} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {!focused && (
        <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]}>
          <Nameplate name={node.name} descriptor={node.descriptor} accent={node.accent} onSelect={onSelect} />
        </Html>
      )}
      {children}
    </group>
  )
}
```

(Import `Nameplate` at top: `import { Nameplate } from '@/components/hud/Nameplate'`.)

- [ ] **Step 4: DestinationField** — `src/components/scene/DestinationField.tsx` (tower placeholder sphere until Task 10):

```tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Planet } from '@/components/scene/Planet'
import { parseRoute } from '@/lib/nav'
import type { DestinationNode } from '@/lib/content/scene-data'

export function DestinationField({ sceneData }: { sceneData: DestinationNode[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))
  const focusedSlug = target.view === 'director' ? null : target.planet

  return (
    <>
      {sceneData.map((node) => (
        <Planet
          key={node.slug}
          node={node}
          focused={focusedSlug === node.slug}
          onSelect={() => router.push(`/${node.slug}`)}
        />
      ))}
    </>
  )
}
```

- [ ] **Step 5: CameraRig** — `src/components/scene/CameraRig.tsx`:

```tsx
'use client'
import { useFrame } from '@react-three/fiber'
import { usePathname } from 'next/navigation'
import { easing } from 'maath'
import * as THREE from 'three'
import { parseRoute } from '@/lib/nav'
import { useSceneStore } from '@/lib/store'
import type { DestinationNode } from '@/lib/content/scene-data'

const DIRECTOR_POS = new THREE.Vector3(0, 0, 14)
const ORIGIN = new THREE.Vector3(0, 0, 0)

export function CameraRig({ sceneData }: { sceneData: DestinationNode[] }) {
  const pathname = usePathname()
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))

  useFrame((state, delta) => {
    const focused = target.view === 'director' ? null : sceneData.find((d) => d.slug === target.planet)
    const wanted = focused
      ? new THREE.Vector3(...focused.position).add(new THREE.Vector3(0, 0.4, 4.2))
      : DIRECTOR_POS
    const lookAt = focused ? new THREE.Vector3(...focused.position) : ORIGIN

    if (reducedMotion) {
      state.camera.position.copy(wanted)
    } else {
      easing.damp3(state.camera.position, wanted, 0.6, delta)
      if (!focused) {
        state.camera.position.x += Math.sin(state.clock.elapsedTime * 0.1) * 0.003
        state.camera.position.y += Math.cos(state.clock.elapsedTime * 0.08) * 0.002
      }
    }
    state.camera.lookAt(lookAt)
  })

  return null
}
```

- [ ] **Step 6: Wire into SceneCanvas** — replace the Task 9 comment in `SceneCanvas.tsx` with:

```tsx
<DestinationField sceneData={sceneData} />
<CameraRig sceneData={sceneData} />
```

(with imports). Keep `<Canvas>` props unchanged.

- [ ] **Step 7: Verify manually** — `npm run dev`: five bodies visible with distinct colors; hover raises bracket nameplate; click flies camera in ~1.5s and URL becomes `/professional`; browser back flies out. `npm run build` still passes.

- [ ] **Step 8: Report changed files.**

---

### Task 10: Destination view — city markers, drag rotation, Tower station

**Files:**
- Create: `src/components/scene/CityMarker.tsx`, `src/components/scene/TowerStation.tsx`
- Modify: `src/components/scene/Planet.tsx` (drag-to-rotate when focused), `src/components/scene/DestinationField.tsx` (render markers when focused; tower geometry)

**Interfaces:**
- Consumes: `CityNode`, `latLngToVector3` (Task 5), `Nameplate`.
- Produces: `<CityMarker city accent radius onSelect />` placed via lat/lng; `<TowerStation accent />` station geometry (replaces sphere mesh for `kind: 'station'`).

- [ ] **Step 1: CityMarker** — `src/components/scene/CityMarker.tsx`:

```tsx
'use client'
import { Html } from '@react-three/drei'
import { latLngToVector3 } from '@/lib/geo'
import { Nameplate } from '@/components/hud/Nameplate'
import type { CityNode } from '@/lib/content/scene-data'

export function CityMarker({
  city,
  accent,
  radius,
  onSelect,
}: {
  city: CityNode
  accent: string
  radius: number
  onSelect: () => void
}) {
  const position = latLngToVector3(city.lat, city.lng, radius)
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 4]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <planeGeometry args={[0.09, 0.09]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <Html position={[0, 0.18, 0]} center zIndexRange={[5, 0]} occlude>
        <Nameplate name={city.name} descriptor={city.descriptor} accent={accent} onSelect={onSelect} />
      </Html>
    </group>
  )
}
```

- [ ] **Step 2: Drag-to-rotate** — in `Planet.tsx`, when `focused`, attach pointer handlers on the group: on pointer down record `(x, rotationY)`; on pointer move with button held, set `group.current.rotation.y = startRotation + (e.clientX - startX) * 0.005` (mutating three objects in handlers/useFrame is the allowed exception). Disable auto-rotation while dragging (`useRef<boolean>` flag); resume slow auto-rotate (`delta * 0.02`) when focused and not dragging.

- [ ] **Step 3: Markers when focused** — in `DestinationField.tsx`, pass markers as `children` of the focused planet:

```tsx
<Planet key={node.slug} node={node} focused={focusedSlug === node.slug} onSelect={() => router.push(`/${node.slug}`)}>
  {focusedSlug === node.slug &&
    node.cityNodes.map((city) => (
      <CityMarker key={city.slug} city={city} accent={node.accent} radius={1.45} onSelect={() => router.push(city.href)} />
    ))}
</Planet>
```

- [ ] **Step 4: TowerStation** — `src/components/scene/TowerStation.tsx`:

```tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function TowerStation({ accent }: { accent: string }) {
  const lights = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (lights.current) {
      const material = lights.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2)
    }
  })
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.25, 0.45, 1.6, 8]} />
        <meshStandardMaterial color="#8E99AC" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.06, 8, 32]} />
        <meshStandardMaterial color="#B8C2D4" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
        <meshStandardMaterial color="#8E99AC" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={lights} position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={accent} transparent />
      </mesh>
    </group>
  )
}
```

In `Planet.tsx`, when `node.kind === 'station'`, render `<TowerStation accent={node.accent} />` in place of the two sphere meshes (keep the same hover/click handlers on a wrapping `<group>`; scale markers radius 1.0). Keep the atmosphere shell only for planets.

- [ ] **Step 5: Verify manually** — `/professional` shows three amber markers with nameplates; dragging rotates the globe; clicking Work navigates to `/professional/work`; `/tower` shows the station with pulsing light and the Live Feed marker; `/education` shows no markers.

- [ ] **Step 6: Report changed files.**

### Task 11: Panel system & content panels (MDX)

**Files:**
- Create: `src/components/hud/Panel.tsx`, `src/components/panels/Mdx.tsx`, `src/components/panels/EducationPanel.tsx`, `src/components/panels/EntryListPanel.tsx`, `src/components/panels/HobbyPanel.tsx`, `src/components/panels/BlogTopicPanel.tsx`, `src/components/panels/PostPanel.tsx`, `src/components/hud/ComingSoonPanel.tsx`
- Modify: `src/app/[planet]/page.tsx`, `src/app/[planet]/[city]/page.tsx`, `src/app/blog/[topic]/[slug]/page.tsx` (replace placeholders)
- Test: `src/components/panels/__tests__/panels.test.tsx`

**Interfaces:**
- Consumes: loader + schemas, `.panel` CSS, framer-motion.
- Produces: `<Panel accent title kicker backHref?>{children}</Panel>` (client, slides in; back link renders when `backHref` given); server panels for each route. `<Mdx source={string} />` renders MDX body.

- [ ] **Step 1: Panel frame** — `src/components/hud/Panel.tsx`:

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export function Panel({
  accent,
  title,
  kicker,
  backHref,
  children,
}: {
  accent: string
  title: string
  kicker: string
  backHref?: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <motion.aside
      className="panel"
      style={{ '--accent': accent } as CSSProperties}
      initial={reduced ? { opacity: 0 } : { x: 48, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label={title}
    >
      <header className="panel-header">
        {backHref && (
          <p className="kicker" style={{ marginBottom: 8 }}>
            <Link href={backHref}>← Back</Link>
          </p>
        )}
        <p className="kicker">{kicker}</p>
        <h1 style={{ fontSize: '1.4rem', marginTop: 4 }}>{title}</h1>
      </header>
      <div className="panel-body">{children}</div>
    </motion.aside>
  )
}
```

- [ ] **Step 2: MDX renderer** — `src/components/panels/Mdx.tsx`:

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc'

export function Mdx({ source }: { source: string }) {
  return <MDXRemote source={source} />
}
```

- [ ] **Step 3: Server panels** — all in `src/components/panels/`:

`EducationPanel.tsx`:

```tsx
import { loadCollection } from '@/lib/content/loader'
import { baseFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function EducationPanel() {
  const entries = loadCollection('education', baseFrontmatter)
  return (
    <Panel accent="#5B9DFF" kicker="Destination · Education" title="Education" backHref="/">
      {entries.map((e) => (
        <article key={e.slug} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem' }}>{e.frontmatter.title}</h2>
          <p className="kicker" style={{ margin: '4px 0 12px' }}>{e.frontmatter.summary}</p>
          <Mdx source={e.body} />
        </article>
      ))}
    </Panel>
  )
}
```

`EntryListPanel.tsx` (professional cities — work/ventures/projects):

```tsx
import { loadCollection, type Entry } from '@/lib/content/loader'
import { workFrontmatter, projectFrontmatter, baseFrontmatter } from '@/lib/content/schemas'
import type { WorkFrontmatter, ProjectFrontmatter, BaseFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

const CITY_META = {
  work: { title: 'Work', schema: workFrontmatter },
  ventures: { title: 'Personal Ventures', schema: baseFrontmatter },
  projects: { title: 'Projects', schema: projectFrontmatter },
} as const

export function EntryListPanel({ city }: { city: keyof typeof CITY_META }) {
  const meta = CITY_META[city]
  const entries = loadCollection(`professional/${city}`, meta.schema) as Entry<
    WorkFrontmatter | ProjectFrontmatter | BaseFrontmatter
  >[]
  return (
    <Panel accent="#F5A83C" kicker={`Professional · ${meta.title}`} title={meta.title} backHref="/professional">
      {entries.map((e) => {
        const fm = e.frontmatter
        return (
          <article key={e.slug} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.05rem' }}>{fm.title}</h2>
            {'org' in fm && (
              <p className="kicker" style={{ margin: '4px 0' }}>{fm.org} · {fm.role} · {fm.period}</p>
            )}
            <p className="kicker" style={{ margin: '4px 0 12px' }}>{fm.summary}</p>
            <Mdx source={e.body} />
            {'links' in fm && Object.entries(fm.links).map(([label, url]) => (
              <p key={label}>
                <a href={url} target="_blank" rel="noreferrer">{label} ↗</a>
              </p>
            ))}
          </article>
        )
      })}
    </Panel>
  )
}
```

`HobbyPanel.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { loadCollection } from '@/lib/content/loader'
import { hobbyFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function HobbyPanel({ slug }: { slug: string }) {
  const entry = loadCollection('hobbies', hobbyFrontmatter).find((e) => e.slug === slug)
  if (!entry) notFound()
  return (
    <Panel accent="#35E0B2" kicker="Hobbies" title={entry.frontmatter.title} backHref="/hobbies">
      <Mdx source={entry.body} />
    </Panel>
  )
}
```

`BlogTopicPanel.tsx`:

```tsx
import Link from 'next/link'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'

export function BlogTopicPanel({ topic }: { topic: string }) {
  const posts = loadCollection('blog', blogFrontmatter).filter((p) => p.frontmatter.topic === topic)
  return (
    <Panel accent="#9F6BFF" kicker="Blog · Topic" title={topic} backHref="/blog">
      <ul style={{ listStyle: 'none' }}>
        {posts.map((p) => (
          <li key={p.slug} style={{ marginBottom: '1.5rem' }}>
            <Link href={`/blog/${topic}/${p.slug}`} className="display" style={{ fontSize: '1rem' }}>
              {p.frontmatter.title}
            </Link>
            <p className="kicker" style={{ marginTop: 4 }}>
              {p.frontmatter.date.toISOString().slice(0, 10)} — {p.frontmatter.summary}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
```

`PostPanel.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { loadCollection } from '@/lib/content/loader'
import { blogFrontmatter } from '@/lib/content/schemas'
import { Panel } from '@/components/hud/Panel'
import { Mdx } from '@/components/panels/Mdx'

export function PostPanel({ topic, slug }: { topic: string; slug: string }) {
  const post = loadCollection('blog', blogFrontmatter).find(
    (p) => p.slug === slug && p.frontmatter.topic === topic,
  )
  if (!post) notFound()
  return (
    <Panel
      accent="#9F6BFF"
      kicker={`Blog · ${topic} · ${post.frontmatter.date.toISOString().slice(0, 10)}`}
      title={post.frontmatter.title}
      backHref={`/blog/${topic}`}
    >
      <Mdx source={post.body} />
    </Panel>
  )
}
```

`src/components/hud/ComingSoonPanel.tsx`:

```tsx
import { Panel } from '@/components/hud/Panel'

export function ComingSoonPanel() {
  return (
    <Panel accent="#C9D4E4" kicker="The Tower · Live Feed" title="Transmission offline" backHref="/tower">
      <p>This channel isn&apos;t broadcasting yet. A live feed is planned — check back soon.</p>
    </Panel>
  )
}
```

- [ ] **Step 4: Wire routes** — replace placeholder returns:

`src/app/[planet]/page.tsx`: education case returns `<EducationPanel />`.

`src/app/[planet]/[city]/page.tsx`:

```tsx
export default async function CityPage({ params }: { params: Promise<{ planet: string; city: string }> }) {
  const { planet, city } = await params
  if (planet === 'professional') return <EntryListPanel city={city as 'work' | 'ventures' | 'projects'} />
  if (planet === 'hobbies') return <HobbyPanel slug={city} />
  if (planet === 'blog') return <BlogTopicPanel topic={city} />
  if (planet === 'tower') return <ComingSoonPanel />
  return null
}
```

`src/app/blog/[topic]/[slug]/page.tsx`: return `<PostPanel topic={topic} slug={slug} />`.

- [ ] **Step 5: Write failing panel tests** — `src/components/panels/__tests__/panels.test.tsx` (framer-motion works in jsdom):

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel } from '@/components/hud/Panel'

vi.mock('next/navigation', () => ({ notFound: vi.fn() }))

describe('Panel', () => {
  it('renders kicker, title, and body content', () => {
    render(
      <Panel accent="#F5A83C" kicker="Professional · Work" title="Work">
        <p>Body text</p>
      </Panel>,
    )
    expect(screen.getByText('Professional · Work')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Work' })).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })
  it('renders a back link when backHref is given', () => {
    render(
      <Panel accent="#F5A83C" kicker="k" title="t" backHref="/professional">
        <p>x</p>
      </Panel>,
    )
    expect(screen.getByRole('link', { name: '← Back' })).toHaveAttribute('href', '/professional')
  })
})
```

Run before wiring Step 1 if following strict TDD order; otherwise run now and confirm PASS (they were written against the interface, not the implementation).

- [ ] **Step 6: Verify** — `npm test` PASS; `npm run build` PASS; dev-check `/professional/work`, `/hobbies/tennis`, `/blog/meta`, `/blog/meta/hello-world`, `/tower/feed`, `/education` all show styled panels over the scene.

- [ ] **Step 7: Report changed files.**

---

### Task 12: Persistent HUD — About tabs, Contact, index shortcut

**Files:**
- Create: `src/components/hud/HudChrome.tsx`
- Modify: `src/components/scene/SceneRoot.tsx`, `src/app/layout.tsx`
- Test: `src/components/hud/__tests__/hud.test.tsx`

**Interfaces:**
- Consumes: `loadPage` (Task 4), `Panel`, `Mdx`.
- Produces: `<HudChrome about now uses contact />` where each prop is a rendered `ReactNode`; SceneRoot gains a `hud: ReactNode` prop rendered above the panel slot.

- [ ] **Step 1: Write failing tests** — `src/components/hud/__tests__/hud.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HudChrome } from '@/components/hud/HudChrome'

const props = {
  about: <p>About body</p>,
  now: <p>Now body</p>,
  uses: <p>Uses body</p>,
  contact: <p>Contact body</p>,
}

describe('HudChrome', () => {
  it('opens the About panel with tabs and switches to Now', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /vikram/i }))
    expect(screen.getByText('About body')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Now' }))
    expect(screen.getByText('Now body')).toBeInTheDocument()
  })
  it('opens Contact from the transmission button', async () => {
    render(<HudChrome {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /contact/i }))
    expect(screen.getByText('Contact body')).toBeInTheDocument()
  })
  it('links to the destinations index', () => {
    render(<HudChrome {...props} />)
    expect(screen.getByRole('link', { name: /index/i })).toHaveAttribute('href', '/destinations')
  })
})
```

Add dev dep `@testing-library/user-event` to `package.json` (`^14.6.0`) and `npm install`.

- [ ] **Step 2: Run to verify failure**, then implement `src/components/hud/HudChrome.tsx`:

```tsx
'use client'
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Panel } from '@/components/hud/Panel'

type Overlay = 'about' | 'contact' | null
type AboutTab = 'about' | 'now' | 'uses'

export function HudChrome({
  about,
  now,
  uses,
  contact,
}: {
  about: ReactNode
  now: ReactNode
  uses: ReactNode
  contact: ReactNode
}) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [tab, setTab] = useState<AboutTab>('about')
  const tabs: { id: AboutTab; label: string; content: ReactNode }[] = [
    { id: 'about', label: 'About', content: about },
    { id: 'now', label: 'Now', content: now },
    { id: 'uses', label: 'Uses', content: uses },
  ]

  return (
    <>
      <nav
        aria-label="Site controls"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 30,
          display: 'flex', gap: 8, pointerEvents: 'auto',
        }}
      >
        <button type="button" className="hud-button" onClick={() => { setOverlay('about'); setTab('about') }}>
          Vikram Penumarti
        </button>
        <button type="button" className="hud-button" onClick={() => setOverlay('contact')}>
          Contact
        </button>
        <Link href="/destinations" className="hud-button" style={{ textDecoration: 'none', lineHeight: 1.5 }}>
          Index
        </Link>
      </nav>
      <AnimatePresence>
        {overlay === 'about' && (
          <Panel accent="#E9EDF5" kicker="Guardian file" title="About">
            <div role="tablist" aria-label="About sections" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className="hud-button"
                  style={tab === t.id ? { borderColor: 'var(--starlight)' } : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button type="button" className="hud-button" onClick={() => setOverlay(null)} style={{ position: 'absolute', top: 24, right: 24 }}>
              Close
            </button>
            {tabs.find((t) => t.id === tab)?.content}
          </Panel>
        )}
        {overlay === 'contact' && (
          <Panel accent="#E9EDF5" kicker="Open a channel" title="Contact">
            <button type="button" className="hud-button" onClick={() => setOverlay(null)} style={{ position: 'absolute', top: 24, right: 24 }}>
              Close
            </button>
            {contact}
          </Panel>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 3: Wire through layout** — `SceneRoot` gains `hud?: ReactNode` rendered before the children overlay div (inside a `pointer-events: none` wrapper is fine — nav re-enables). In `src/app/layout.tsx`:

```tsx
import { HudChrome } from '@/components/hud/HudChrome'
import { loadPage } from '@/lib/content/loader'
import { Mdx } from '@/components/panels/Mdx'
// inside RootLayout:
const hud = (
  <HudChrome
    about={<Mdx source={loadPage('about').body} />}
    now={<Mdx source={loadPage('now').body} />}
    uses={<Mdx source={loadPage('uses').body} />}
    contact={<Mdx source={loadPage('contact').body} />}
  />
)
return (
  <html lang="en">
    <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <SceneRoot sceneData={sceneData} hud={hud}>{children}</SceneRoot>
    </body>
  </html>
)
```

- [ ] **Step 4: Run tests** — `npm test` → PASS. Dev-check: HUD buttons visible on every route; About tabs switch; Contact opens; Index navigates.

- [ ] **Step 5: Report changed files.**

---

### Task 13: Accessibility, reduced motion & device tiers

**Files:**
- Create: `src/lib/device-tier.ts`, `src/components/scene/SceneSettings.tsx`
- Modify: `src/components/scene/SceneRoot.tsx` (mount SceneSettings), `src/components/scene/SceneCanvas.tsx` (Esc handling)
- Test: `src/lib/__tests__/device-tier.test.ts`

**Interfaces:**
- Consumes: `useSceneStore` setters.
- Produces: `pickTier(input: { cores: number; memoryGb?: number }): 'high' | 'low'`; `<SceneSettings />` (client, renders null; syncs tier + reduced motion into the store; installs Esc → navigate up handler).

- [ ] **Step 1: Write failing tests** — `src/lib/__tests__/device-tier.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pickTier } from '@/lib/device-tier'

describe('pickTier', () => {
  it('gives high tier to capable machines', () => {
    expect(pickTier({ cores: 10, memoryGb: 16 })).toBe('high')
  })
  it('gives low tier to weak machines', () => {
    expect(pickTier({ cores: 2 })).toBe('low')
    expect(pickTier({ cores: 8, memoryGb: 2 })).toBe('low')
  })
  it('defaults to high when memory is unknown but cores suffice', () => {
    expect(pickTier({ cores: 6 })).toBe('high')
  })
})
```

- [ ] **Step 2: Run to verify failure**, then implement `src/lib/device-tier.ts`:

```ts
export function pickTier(input: { cores: number; memoryGb?: number }): 'high' | 'low' {
  if (input.cores < 4) return 'low'
  if (input.memoryGb !== undefined && input.memoryGb < 4) return 'low'
  return 'high'
}
```

- [ ] **Step 3: SceneSettings** — `src/components/scene/SceneSettings.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { pickTier } from '@/lib/device-tier'
import { useSceneStore } from '@/lib/store'

export function SceneSettings() {
  const setTier = useSceneStore((s) => s.setTier)
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    setTier(pickTier({ cores: nav.hardwareConcurrency ?? 4, memoryGb: nav.deviceMemory }))
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [setTier, setReducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || pathname === '/') return
      const up = pathname.split('/').filter(Boolean).slice(0, -1).join('/')
      router.push(up ? `/${up}` : '/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, router])

  return null
}
```

Mount `<SceneSettings />` inside `SceneRoot` (top level, outside the canvas).

- [ ] **Step 4: Verify** — `npm test` PASS. Manual: Esc from `/professional/work` → `/professional` → `/` ; with OS reduced-motion on, camera jumps instead of flying (CameraRig already reads the store); nameplates reachable by Tab (drei `<Html>` renders real buttons) and Enter activates.

- [ ] **Step 5: Report changed files.**

---

### Task 14: E2E suite & release verification

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/fallback.spec.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the whole app; `npm run build` output served statically.

- [ ] **Step 1: Playwright config** — `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run build && npx serve out -l 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

Add dev dep `serve` (`^14.2.0`) and `npm install`.

- [ ] **Step 2: Navigation flows** — `tests/e2e/navigation.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('director → planet → city → content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: /professional/i }).click()
  await expect(page).toHaveURL(/\/professional$/)
  await page.getByRole('button', { name: /^work/i }).click()
  await expect(page).toHaveURL(/\/professional\/work$/)
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()
})

test('direct URL to a blog post renders the reading panel', async ({ page }) => {
  await page.goto('/blog/meta/hello-world')
  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
  await expect(page.getByText('Welcome aboard')).toBeVisible()
})

test('HUD About tabs and Contact work from any view', async ({ page }) => {
  await page.goto('/hobbies')
  await page.getByRole('button', { name: /vikram/i }).click()
  await page.getByRole('tab', { name: 'Now' }).click()
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
})

test('keyboard-only: tab to a planet nameplate and enter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /education/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/education$/)
  await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible()
})
```

- [ ] **Step 3: WebGL fallback** — `tests/e2e/fallback.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('no WebGL → fallback notice with index link, content still reachable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (typeof type === 'string' && type.includes('webgl')) return null
      return original.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await expect(page.getByText(/3D unavailable/i)).toBeVisible()
  await page.getByRole('link', { name: /destination index/i }).click()
  await expect(page.getByRole('heading', { name: /all destinations/i })).toBeVisible()
  await page.getByRole('link', { name: 'Tennis' }).click()
  await expect(page.getByRole('heading', { name: 'Tennis' })).toBeVisible()
})
```

- [ ] **Step 4: Render smoke** — `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('scene renders without console errors and canvas is live', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/director-smoke.png' })
  expect(errors).toEqual([])
})
```

- [ ] **Step 5: Run everything**

Run: `npm test` → PASS. `npm run test:coverage` → thresholds met (≥80% on `src/lib` + `src/config`). `npm run test:e2e` → PASS.

- [ ] **Step 6: Deployment note** — no `vercel.json` needed: Vercel auto-detects Next.js and respects `output: 'export'`. Document in the final report: user connects the GitHub repo in the Vercel dashboard; every push to `main` deploys.

- [ ] **Step 7: Final report** — list all files, summarize test results, remind the user that seed content copy (roles, hobbies, about/now/uses text) is theirs to replace, and that everything is ready for them to commit and push.

---

## Self-Review Notes

- **Spec coverage:** Director/destination/city views (Tasks 8–11), Tower + coming-soon feed (Tasks 6, 10, 11), About/Now/Uses tabs + Contact + index HUD (Task 12), colophon entry (Task 7 seed content), WebGL fallback + error boundaries (Task 8, tested Task 14), reduced motion + keyboard + device tiers (Task 13), MDX pipeline with build-failing validation (Tasks 3–4), deep-linkable URLs (Task 7), static export + Vercel (Tasks 1, 14).
- **Deliberately deferred (per spec):** live feed backend; postprocessing bloom (listed in stack; add only if frame budget allows after Task 13 — not required for v1).
- **Type consistency:** `Entry<T>`, `CityNode`, `DestinationNode`, `SceneTarget`, store shape defined once and reused verbatim in later tasks.



