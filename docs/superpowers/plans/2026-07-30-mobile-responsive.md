# Mobile-Responsive Starmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D starmap and HTML chrome work at any viewport — responsive camera framing, non-overlapping mobile chrome, and touch ergonomics.

**Architecture:** A pure math module (`camera-fit.ts`) computes the camera overview distance and focus-offset scale from viewport aspect; `CameraRig` consumes it via `useThree`. The HTML layer gets a reworked mobile breakpoint (header-aware panel padding, safe-area insets, smaller chrome) and touch guards (touch-action, coarse-pointer thresholds, ≥44px tap targets). A Playwright mobile spec locks in the two user-visible invariants.

**Tech Stack:** Next.js 15 (App Router, static export), React Three Fiber, three.js, maath easing, framer-motion, vitest (jsdom), Playwright (static export served on :3100).

**Spec:** `docs/superpowers/specs/2026-07-30-mobile-responsive-design.md`

## Global Constraints

- Work on branch `fix/mobile-responsive`. Commits are local; the user pushes/merges.
- Commit format: `<type>: <description>` (feat/fix/refactor/docs/test/chore). No attribution footers.
- Desktop framing must remain visually unchanged: at aspect ≥ ~16/9 the overview distance stays 14 and the focus offset scale stays 1 (clamps guarantee this).
- Destination world positions in `src/config/destinations.ts` are NOT modified.
- The only allowed fov value is the shared `SCENE_FOV = 50` constant (Task 1); `SceneCanvas` and `CameraRig` must both consume it.
- Existing breakpoint stays at `max-width: 768px`; coarse-pointer styling uses `(pointer: coarse)`.
- TDD for the pure-math module (Task 1). Scene/CSS tasks are verified by build + the Task 5 Playwright spec (R3F rendering isn't unit-testable in jsdom).
- Run `npm run build`, `npx vitest run`, before every commit. `npx playwright test` where the task says so.

---

### Task 0: Branch setup

- [ ] **Step 1: Create the feature branch from current main**

```bash
cd /Users/vpenumarti/Documents/CS/Personal/personal-site
git checkout main && git pull && git checkout -b fix/mobile-responsive
```

(When executing via worktree, create the worktree from origin/main and rename its branch to `fix/mobile-responsive`.)

---

### Task 1: Camera-fit math module

**Files:**
- Create: `src/lib/camera-fit.ts`
- Test: `src/lib/camera-fit.test.ts` (colocated, matching vitest include)

**Interfaces:**
- Consumes: nothing.
- Produces (Task 2 uses all of these verbatim):
  - `SCENE_FOV = 50` (vertical fov, degrees)
  - `OVERVIEW_MIN_DISTANCE = 14`, `OVERVIEW_MAX_DISTANCE = 44`
  - `NAMEPLATE_MARGIN = 1.5`, `FOCUS_FIT_RADIUS = 1.9`
  - `BASE_FOCUS_OFFSET: readonly [number, number, number] = [1.7, 0.5, 3.7]`
  - `overviewDistance(positions: ReadonlyArray<readonly [number, number, number]>, fovDeg: number, aspect: number): number`
  - `focusOffsetScale(fovDeg: number, aspect: number): number`

The math: the camera sits at `(0, 0, d)` looking at the origin. A destination at `(x, y, z)` is at depth `d - z` from the camera. It is inside the horizontal frustum when `(|x| + margin) / (d - z) ≤ tan(hFov/2)`, i.e. `d ≥ z + (|x| + margin) / tan(hFov/2)` — and similarly vertically with `tan(vFov/2)`. `hFov` comes from `tan(hFov/2) = tan(vFov/2) · aspect`. `overviewDistance` returns the max requirement over all destinations and both axes, clamped to `[OVERVIEW_MIN_DISTANCE, OVERVIEW_MAX_DISTANCE]`. The min-clamp is what keeps desktop framing exactly at today's `z = 14`.

- [ ] **Step 1: Write the failing tests**

`src/lib/camera-fit.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  BASE_FOCUS_OFFSET,
  FOCUS_FIT_RADIUS,
  NAMEPLATE_MARGIN,
  OVERVIEW_MAX_DISTANCE,
  OVERVIEW_MIN_DISTANCE,
  SCENE_FOV,
  focusOffsetScale,
  overviewDistance,
} from './camera-fit'

// Real destination positions from src/config/destinations.ts
const POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [-7, 2, -4],      // education
  [5, 1, -8],       // professional
  [-2, -3, -11],    // hobbies
  [7.2, -2.8, -1.5], // blog
  [1, 4, -6],       // tower
]

const tanHalf = (deg: number) => Math.tan(((deg / 2) * Math.PI) / 180)

describe('overviewDistance', () => {
  it('keeps the current framing on desktop aspects (min clamp)', () => {
    expect(overviewDistance(POSITIONS, SCENE_FOV, 16 / 9)).toBe(OVERVIEW_MIN_DISTANCE)
    expect(overviewDistance(POSITIONS, SCENE_FOV, 2.4)).toBe(OVERVIEW_MIN_DISTANCE)
  })

  it('pulls back on portrait aspects', () => {
    const d = overviewDistance(POSITIONS, SCENE_FOV, 390 / 844)
    expect(d).toBeGreaterThan(OVERVIEW_MIN_DISTANCE)
    expect(d).toBeLessThanOrEqual(OVERVIEW_MAX_DISTANCE)
  })

  it('actually fits every destination horizontally at the returned distance', () => {
    const aspect = 390 / 844
    const d = overviewDistance(POSITIONS, SCENE_FOV, aspect)
    const tanH = tanHalf(SCENE_FOV) * aspect
    for (const [x, , z] of POSITIONS) {
      expect((Math.abs(x) + NAMEPLATE_MARGIN) / (d - z)).toBeLessThanOrEqual(tanH + 1e-9)
    }
  })

  it('is monotonic: narrower aspect never gets closer', () => {
    const wide = overviewDistance(POSITIONS, SCENE_FOV, 1.2)
    const narrow = overviewDistance(POSITIONS, SCENE_FOV, 0.5)
    expect(narrow).toBeGreaterThanOrEqual(wide)
  })

  it('never returns NaN/Infinity on extreme aspects', () => {
    for (const aspect of [0.2, 0.01, 5, 10]) {
      const d = overviewDistance(POSITIONS, SCENE_FOV, aspect)
      expect(Number.isFinite(d)).toBe(true)
      expect(d).toBeGreaterThanOrEqual(OVERVIEW_MIN_DISTANCE)
      expect(d).toBeLessThanOrEqual(OVERVIEW_MAX_DISTANCE)
    }
  })
})

describe('focusOffsetScale', () => {
  it('is 1 on desktop aspects (no change to current framing)', () => {
    expect(focusOffsetScale(SCENE_FOV, 16 / 9)).toBe(1)
  })

  it('grows on portrait so the focused planet fits', () => {
    const s = focusOffsetScale(SCENE_FOV, 390 / 844)
    expect(s).toBeGreaterThan(1)
    // Scaled offset length must reach the distance where FOCUS_FIT_RADIUS
    // fits the horizontal half-fov.
    const offsetLen = Math.hypot(...BASE_FOCUS_OFFSET)
    const tanH = tanHalf(SCENE_FOV) * (390 / 844)
    expect(s * offsetLen).toBeGreaterThanOrEqual(FOCUS_FIT_RADIUS / tanH - 1e-9)
  })

  it('is finite on extreme aspects', () => {
    for (const aspect of [0.2, 0.01, 5]) {
      expect(Number.isFinite(focusOffsetScale(SCENE_FOV, aspect))).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/camera-fit.test.ts`
Expected: FAIL — cannot resolve `./camera-fit`

- [ ] **Step 3: Implement camera-fit.ts**

```ts
/**
 * Pure viewport-fit math for the starmap camera. The camera sits on the +z
 * axis looking at the origin; these helpers compute how far back it must sit
 * (and how far a focused-planet approach must scale out) so content fits the
 * current viewport aspect. Kept free of three.js so it is unit-testable.
 */

export const SCENE_FOV = 50 // vertical fov, degrees — single source of truth

/** Desktop design distance; also the floor so wide viewports never change. */
export const OVERVIEW_MIN_DISTANCE = 14
/** Emergency ceiling for absurd aspects (e.g. tall split-screen slivers). */
export const OVERVIEW_MAX_DISTANCE = 44
/** World-units of slack around each destination for its nameplate. */
export const NAMEPLATE_MARGIN = 1.5
/** Radius that must fit when a planet is focused — derived from what the
 * current desktop approach already fits: |BASE_FOCUS_OFFSET|·tan(vFov/2) ≈ 1.91.
 * Keeping it at (not above) that bound is what makes desktop scale exactly 1. */
export const FOCUS_FIT_RADIUS = 1.9
/** The cinematic approach offset used by CameraRig at desktop aspect. */
export const BASE_FOCUS_OFFSET: readonly [number, number, number] = [1.7, 0.5, 3.7]

const tanHalfDeg = (deg: number) => Math.tan(((deg / 2) * Math.PI) / 180)

/**
 * Distance from the origin (along +z) at which every destination — padded by
 * NAMEPLATE_MARGIN — is inside both frustum planes. A destination at (x,y,z)
 * seen from (0,0,d) is at depth d - z, so the horizontal constraint is
 * (|x| + m) / (d - z) <= tan(hFov/2), i.e. d >= z + (|x| + m)/tan(hFov/2).
 */
export function overviewDistance(
  positions: ReadonlyArray<readonly [number, number, number]>,
  fovDeg: number,
  aspect: number,
): number {
  const tanV = tanHalfDeg(fovDeg)
  const tanH = tanV * aspect
  let required = OVERVIEW_MIN_DISTANCE
  for (const [x, y, z] of positions) {
    required = Math.max(
      required,
      z + (Math.abs(x) + NAMEPLATE_MARGIN) / tanH,
      z + (Math.abs(y) + NAMEPLATE_MARGIN) / tanV,
    )
  }
  return Math.min(required, OVERVIEW_MAX_DISTANCE)
}

/**
 * Multiplier for BASE_FOCUS_OFFSET so a focused planet (FOCUS_FIT_RADIUS)
 * fits the narrower frustum axis. 1 on desktop aspects by construction.
 */
export function focusOffsetScale(fovDeg: number, aspect: number): number {
  const tanV = tanHalfDeg(fovDeg)
  const tanNarrow = Math.min(tanV, tanV * aspect)
  const requiredDistance = FOCUS_FIT_RADIUS / tanNarrow
  const baseLength = Math.hypot(...BASE_FOCUS_OFFSET)
  return Math.max(1, requiredDistance / baseLength)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/camera-fit.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Full suite + commit**

Run: `npx vitest run`
Expected: all pass.

```bash
git add src/lib/camera-fit.ts src/lib/camera-fit.test.ts
git commit -m "feat: aspect-aware camera fit math for responsive starmap framing"
```

---

### Task 2: Wire responsive framing into the scene

**Files:**
- Modify: `src/components/scene/CameraRig.tsx` (whole file below)
- Modify: `src/components/scene/SceneCanvas.tsx:117` (camera prop only)

**Interfaces:**
- Consumes from Task 1: `SCENE_FOV`, `overviewDistance`, `focusOffsetScale`, `BASE_FOCUS_OFFSET`.
- Produces: no new exports; behavior change only.

- [ ] **Step 1: Rewrite CameraRig.tsx**

Replace the full file with:

```tsx
'use client'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePathname } from 'next/navigation'
import { easing } from 'maath'
import * as THREE from 'three'
import { parseRoute } from '@/lib/nav'
import { useSceneStore } from '@/lib/store'
import {
  BASE_FOCUS_OFFSET,
  SCENE_FOV,
  focusOffsetScale,
  overviewDistance,
} from '@/lib/camera-fit'
import type { DestinationNode } from '@/lib/content/scene-data'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const FLIGHT_SMOOTHING = 0.6

export function CameraRig({ sceneData }: { sceneData: DestinationNode[] }) {
  const pathname = usePathname()
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const target = parseRoute(pathname, sceneData.map((d) => d.slug))
  const size = useThree((s) => s.size)
  // Damping the look-at point (not just position) makes the fly-out mirror the
  // fly-in — camera orientation eases along the same path in both directions.
  const lookAt = useRef(ORIGIN.clone())

  // Viewport-aware framing: overview distance and focus-approach scale both
  // derive from the aspect ratio, so portrait screens dolly out instead of
  // cropping destinations. On desktop aspects both resolve to the original
  // constants (z=14, scale 1).
  const aspect = size.width / size.height
  const { overviewPos, focusOffset } = useMemo(() => {
    const distance = overviewDistance(
      sceneData.map((d) => d.position),
      SCENE_FOV,
      aspect,
    )
    const scale = focusOffsetScale(SCENE_FOV, aspect)
    return {
      overviewPos: new THREE.Vector3(0, 0, distance),
      focusOffset: new THREE.Vector3(...BASE_FOCUS_OFFSET).multiplyScalar(scale),
    }
  }, [sceneData, aspect])

  useFrame((state, delta) => {
    const focused = target.view === 'director' ? null : sceneData.find((d) => d.slug === target.planet)
    // Approach from slightly sun-opposed so the terminator (and night-side
    // city lights) sweep across the visible limb — the cinematic angle.
    const wantedPos = focused
      ? new THREE.Vector3(...focused.position).add(focusOffset)
      : overviewPos
    const wantedLookAt = focused ? new THREE.Vector3(...focused.position) : ORIGIN

    if (reducedMotion) {
      state.camera.position.copy(wantedPos)
      lookAt.current.copy(wantedLookAt)
    } else {
      easing.damp3(state.camera.position, wantedPos, FLIGHT_SMOOTHING, delta)
      easing.damp3(lookAt.current, wantedLookAt, FLIGHT_SMOOTHING, delta)
      if (!focused) {
        state.camera.position.x += Math.sin(state.clock.elapsedTime * 0.1) * 0.003
        state.camera.position.y += Math.cos(state.clock.elapsedTime * 0.08) * 0.002
      }
    }
    state.camera.lookAt(lookAt.current)
  })

  return null
}
```

Notes: `DIRECTOR_POS` is gone (replaced by `overviewPos`). Resize/orientation changes flow through `useThree` size → memo → new damping target, so the camera glides to the new framing.

- [ ] **Step 2: Use SCENE_FOV in SceneCanvas**

In `src/components/scene/SceneCanvas.tsx`, add to the imports:

```ts
import { SCENE_FOV } from '@/lib/camera-fit'
```

and change the Canvas camera prop (line 117):

```tsx
      camera={{ position: [0, 0, 14], fov: SCENE_FOV }}
```

(The initial position stays 14 — CameraRig immediately takes over with the fitted distance.)

- [ ] **Step 3: Verify build + suite**

Run: `npm run build && npx vitest run`
Expected: build succeeds (static export), all tests pass.

- [ ] **Step 4: Visual sanity check**

Run: `npx serve out -l 3100 &`, then with Playwright/browser at 390×844 open `http://localhost:3100` — all five nameplates should be on-screen. At 1440×900 the framing should look identical to production today. Kill the server after.

- [ ] **Step 5: Commit**

```bash
git add src/components/scene/CameraRig.tsx src/components/scene/SceneCanvas.tsx
git commit -m "feat: responsive camera framing from viewport aspect"
```

---

### Task 3: Mobile chrome — viewport meta, header, panel, safe areas

**Files:**
- Modify: `src/app/layout.tsx` (add viewport export)
- Modify: `src/components/hud/HudChrome.tsx:32-38` (nav inline styles → class)
- Modify: `src/app/globals.css` (new `.hud-nav` rule; reworked 768px block; overscroll)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `.hud-nav` class (Task 5's e2e locates the nav via `nav[aria-label="Site controls"]`, unchanged).

- [ ] **Step 1: Add the viewport export**

In `src/app/layout.tsx`, after the metadata export (line 11):

```ts
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#060A12',
}
```

(Keep `export const metadata = SITE_METADATA` as is; `Viewport` import goes at the top with the other imports.)

- [ ] **Step 2: Move nav positioning into CSS**

In `src/components/hud/HudChrome.tsx`, replace the `<nav>` opening tag (lines 32-38) with:

```tsx
      <nav aria-label="Site controls" className="hud-nav">
```

- [ ] **Step 3: Update globals.css**

Add after the `.hud-button:hover` rule (line 148):

```css
.hud-nav {
  position: fixed;
  top: calc(16px + env(safe-area-inset-top));
  left: calc(16px + env(safe-area-inset-left));
  z-index: 30;
  display: flex;
  gap: 8px;
  pointer-events: auto;
}
```

Change `html, body` rule (line 12) to:

```css
html, body { height: 100%; overscroll-behavior: none; }
```

Replace the whole `@media (max-width: 768px)` block (lines 213-219) with:

```css
@media (max-width: 768px) {
  :root { --panel-width: 100vw; }
  /* Compact chrome: both buttons fit one row beside the notch */
  .hud-button { padding: 6px 10px; font-size: 0.65rem; }
  /* Full-width panel starts below the fixed hud-nav (16px top + ~28px buttons + 8px gap) */
  .panel { padding-top: calc(52px + env(safe-area-inset-top)); }
  .panel-header { padding: 12px 16px 12px; }
  .panel-body { padding: 16px 16px 32px; padding-bottom: calc(32px + env(safe-area-inset-bottom)); }
  .panel-body .gallery { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .location-bar { top: auto; bottom: calc(18px + env(safe-area-inset-bottom)); }
  .location-bar .esc-hint { display: none; }
  /* Full-screen panel already carries its own back link */
  .location-bar--panel-open { display: none; }
}
```

- [ ] **Step 4: Verify build + suite**

Run: `npm run build && npx vitest run`
Expected: pass. Then serve `out/` at 390×844 and open `/professional/work`: the WORK title must start below the header buttons with no overlap; About overlay via "Vikram Penumarti" button must also clear the buttons.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/hud/HudChrome.tsx
git commit -m "fix: mobile chrome layout, safe-area insets, viewport meta"
```

---

### Task 4: Touch ergonomics

**Files:**
- Modify: `src/components/scene/SceneCanvas.tsx` (touch-action style; coarse-pointer threshold)
- Modify: `src/components/scene/CityMarker.tsx` (invisible hit mesh)
- Modify: `src/app/globals.css` (coarse-pointer nameplate tap targets)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: no new exports.

- [ ] **Step 1: Canvas touch-action + coarse threshold**

In `src/components/scene/SceneCanvas.tsx`:

Change the Canvas style prop (line 118):

```tsx
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
```

Replace the dismissal threshold logic in `handlePointerMissed` (line 55):

```ts
      const down = pointerDownRef.current
      // Touch drags wobble more than mouse drags — give coarse pointers a
      // larger tap threshold so drag-rotation is never read as a dismissal.
      const threshold = window.matchMedia('(pointer: coarse)').matches ? 12 : 8
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > threshold) return
```

- [ ] **Step 2: City-marker hit mesh**

In `src/components/scene/CityMarker.tsx`, replace the visible diamond mesh block (lines 38-41) with:

```tsx
      <mesh ref={diamond} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.09, 0.09]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      {/* Invisible, larger hit area — the visual diamond is a tiny touch target */}
      <mesh rotation={[0, 0, Math.PI / 4]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <planeGeometry args={[0.24, 0.24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
```

(The click handler moves from the visual mesh to the hit mesh; the pulse animation stays on the visual one. `opacity: 0` keeps the mesh raycastable — `visible={false}` would not.)

- [ ] **Step 3: Nameplate tap targets**

Add to `src/app/globals.css`, after the `.nameplate--marker .descriptor` rule (line 85):

```css
/* Coarse pointers get >=44px tap targets without shifting layout */
@media (pointer: coarse) {
  .nameplate { padding: 14px 16px; margin: -8px -2px; }
}
```

- [ ] **Step 4: Verify build + suite**

Run: `npm run build && npx vitest run`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/scene/SceneCanvas.tsx src/components/scene/CityMarker.tsx src/app/globals.css
git commit -m "feat: touch ergonomics — touch-action, coarse thresholds, bigger tap targets"
```

---

### Task 5: Mobile e2e spec

**Files:**
- Test: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: the running static export (playwright.config.ts webServer serves `out/` on :3100); `nav[aria-label="Site controls"]` from HudChrome; `.nameplate`, `.panel-header h1` from globals/Panel.

- [ ] **Step 1: Write the spec**

`tests/e2e/mobile.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const VIEWPORT = { width: 390, height: 844 }
test.use({ viewport: VIEWPORT })

// The camera eases toward its fitted position; give the damping time to settle.
const CAMERA_SETTLE_MS = 3500

test('starmap shows every destination nameplate within the viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nameplate').first()).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(CAMERA_SETTLE_MS)

  const plates = page.locator('.nameplate')
  const count = await plates.count()
  expect(count).toBeGreaterThanOrEqual(5) // education, professional, hobbies, blog, tower

  for (let i = 0; i < count; i++) {
    const box = await plates.nth(i).boundingBox()
    expect(box, `nameplate ${i} should render`).not.toBeNull()
    expect(box!.x, `nameplate ${i} left edge`).toBeGreaterThanOrEqual(0)
    expect(box!.y, `nameplate ${i} top edge`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `nameplate ${i} right edge`).toBeLessThanOrEqual(VIEWPORT.width)
    expect(box!.y + box!.height, `nameplate ${i} bottom edge`).toBeLessThanOrEqual(VIEWPORT.height)
  }
})

test('header buttons do not overlap the panel title on a content route', async ({ page }) => {
  await page.goto('/professional/work')
  const title = page.locator('.panel-header h1')
  await expect(title).toBeVisible()

  const navBox = await page.locator('nav[aria-label="Site controls"]').boundingBox()
  const titleBox = await title.boundingBox()
  expect(navBox).not.toBeNull()
  expect(titleBox).not.toBeNull()

  const intersects =
    navBox!.x < titleBox!.x + titleBox!.width &&
    navBox!.x + navBox!.width > titleBox!.x &&
    navBox!.y < titleBox!.y + titleBox!.height &&
    navBox!.y + navBox!.height > titleBox!.y
  expect(intersects, 'hud nav must not overlap panel title').toBe(false)
})
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test tests/e2e/mobile.spec.ts`
Expected: PASS (webServer builds + serves automatically). If the nameplate test is flaky on settle timing, raise `CAMERA_SETTLE_MS` to 5000 — do not loosen the bounding-box assertions.

- [ ] **Step 3: Run the whole e2e suite**

Run: `npx playwright test`
Expected: existing fallback/navigation/smoke specs still pass alongside the new one.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/mobile.spec.ts
git commit -m "test: mobile viewport e2e — framing and chrome-overlap invariants"
```

---

## Post-plan (user-owned)

- Push branch, PR, merge — Vercel redeploys.
- Real-phone pass: drag-rotate a planet, tap city markers, check notch/home-bar clearance, confirm no pull-to-refresh during drags.
