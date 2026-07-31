import { describe, expect, it } from 'vitest'
import {
  BASE_FOCUS_OFFSET,
  FOCUS_FIT_RADIUS,
  NAMEPLATE_HALF_WIDTH_PX,
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

  it('reserves NAMEPLATE_HALF_WIDTH_PX of screen margin per side when given a portrait viewport', () => {
    const aspect = 390 / 844
    const viewport = { width: 390, height: 844 }
    const d = overviewDistance(POSITIONS, SCENE_FOV, aspect, viewport)
    const tanH = tanHalf(SCENE_FOV) * aspect
    const budget = tanH * (1 - (2 * NAMEPLATE_HALF_WIDTH_PX) / viewport.width)
    for (const [x, , z] of POSITIONS) {
      expect((Math.abs(x) + NAMEPLATE_MARGIN) / (d - z)).toBeLessThanOrEqual(budget + 1e-9)
    }
  })

  it('keeps the desktop invariant (distance 14) even when a desktop viewport is passed', () => {
    expect(overviewDistance(POSITIONS, SCENE_FOV, 16 / 9, { width: 1440, height: 810 })).toBe(14)
  })

  it('stays finite and within the ceiling for an absurdly narrow viewport', () => {
    const d = overviewDistance(POSITIONS, SCENE_FOV, 390 / 844, { width: 100, height: 844 })
    expect(Number.isFinite(d)).toBe(true)
    expect(d).toBeLessThanOrEqual(OVERVIEW_MAX_DISTANCE)
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
