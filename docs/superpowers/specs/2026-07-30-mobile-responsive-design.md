# Mobile-Responsive Starmap

**Date:** 2026-07-30
**Status:** Approved

## Overview

The site's 3D starmap and HTML chrome are desktop-tuned: on phones, planets
sit off-screen, the fixed header overlaps panel titles, and touch ergonomics
are absent. This design adapts the full starmap experience to any viewport —
no separate mobile navigation, no reduced experience.

Root causes (from code exploration):

1. Camera is static (`position [0,0,14]`, `fov 50` in `SceneCanvas.tsx`;
   `DIRECTOR_POS` and the planet fly-to offset hardcoded in `CameraRig.tsx`)
   while destination positions spread wide on x (`destinations.ts`:
   professional x=5, blog x=7.2). Portrait aspects crop the sides.
2. Header buttons (`HudChrome.tsx`, fixed top:16/left:16, z-30) overlap the
   full-width mobile panel (`.panel`, top:0, z-20). Only one breakpoint
   exists (`globals.css` @media 768px: panel width + location bar).
3. No safe-area insets, no `touch-action`/overscroll guards, small tap
   targets (city markers 0.09 world units; nameplates unpadded).

## 1. Responsive Camera Framing

New `src/lib/camera-fit.ts` (pure, unit-testable):

- `overviewDistance(positions, fovDeg, aspect): number` — smallest camera
  distance d (on the +z axis, looking at origin) such that every
  destination at `(x, y, z)`, padded by a nameplate margin, satisfies both
  `(|x| + m) / (d - z) ≤ tan(hFov/2)` and `(|y| + m) / (d - z) ≤ tan(vFov/2)`,
  where `tan(hFov/2) = tan(vFov/2) · aspect`. Clamped to `[14, 44]` — the
  min-clamp keeps desktop framing exactly at today's z=14. (Per-destination
  frustum constraints, not a bounding-sphere fit: a sphere fit ignores that
  far-z destinations project smaller and would needlessly change desktop.)
- `focusOffsetScale(fovDeg, aspect): number` — multiplier ≥ 1 for the
  planet fly-to offset so a focused planet fits the narrower frustum axis.

`CameraRig.tsx` changes:

- Overview position: derive from `overviewDistance` using the aspect from
  `useThree` size and the destination positions (nameplate margin 1.5
  world units). Replaces fixed `z=14`; identical on desktop via the
  min-clamp.
- Planet-focus offset: multiply the hardcoded `(1.7, 0.5, 3.7)` offset by
  `focusOffsetScale(fov, aspect)` (≥ 1, exactly 1 on desktop aspects) so
  focused planets are not clipped in portrait. The fit radius (1.9, derived from what the current desktop approach distance already fits) covers
  planet + ring + nameplate.
- Re-fit smoothly on resize/orientation change (the rig already lerps; new
  targets come from the hook each frame/resize).

## 2. HTML Chrome & Panels

- `src/app/layout.tsx`: add `export const viewport` with
  `width: 'device-width'`, `initialScale: 1`, `viewportFit: 'cover'`,
  `themeColor: '#060A12'` (the `--void` background).
- `globals.css` @media (max-width: 768px) additions:
  - `.hud-button`: smaller padding/font so both buttons fit one row.
  - `.panel`: `padding-top` equal to header height (buttons + 16px margins)
    so panel content starts below the fixed buttons — removes the overlap.
  - `.panel-body`: padding `16px 16px 32px` (from `24px 32px 48px`).
  - `.panel-body .gallery`: `minmax(140px, 1fr)` (from 170px).
- Safe areas: header offsets and panel paddings incorporate
  `env(safe-area-inset-top/left/right/bottom)`; location bar bottom offset
  adds `env(safe-area-inset-bottom)`.

## 3. Touch Ergonomics

- Canvas element: `touch-action: none` (drag-rotate must not fight
  scrolling); `html, body`: `overscroll-behavior: none` (kills
  pull-to-refresh during drags).
- Nameplate buttons: min 44px tap target via padding (visual text size
  unchanged; padding + negative margin so layout doesn't shift).
- Drag-vs-tap threshold in `SceneCanvas.tsx`: 8px on fine pointers, 12px
  when `matchMedia('(pointer: coarse)')` matches.
- City markers: add an invisible hit mesh ~2.5× the visual diamond so taps
  land; visual size unchanged.

## 4. Testing

- Unit (vitest): `fitDistance` — portrait fits horizontally, landscape
  vertically, square aspect, extreme aspects don't return NaN/Infinity;
  desktop reference aspect returns ≈ current framing distance.
- E2E (playwright, iPhone 14-ish viewport 390×844):
  - On `/`, every destination nameplate's bounding box is fully inside the
    viewport.
  - On `/professional/work`, header buttons' bounding boxes do not
    intersect the panel title's box.
- Manual: real-phone pass after deploy (drag rotation, tap targets,
  safe areas on a notched device).

## Out of Scope

- Pinch-zoom / multi-touch gestures
- Mobile-specific navigation UI (list nav)
- Blog styling beyond the shared panels
- PWA/manifest work (tracked separately)
