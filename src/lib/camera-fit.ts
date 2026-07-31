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
