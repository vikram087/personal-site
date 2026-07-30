const HEX_PATTERN = /^#[0-9a-f]{6}$/i

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/**
 * Multiply each RGB channel of a #rrggbb color by `factor` (clamped to 0–255).
 * factor < 1 darkens, factor > 1 lightens toward channel saturation.
 */
export function shadeHex(hex: string, factor: number): string {
  if (!HEX_PATTERN.test(hex)) throw new Error(`shadeHex expects #rrggbb, got: ${hex}`)
  const channels = [1, 3, 5].map((i) => clampChannel(parseInt(hex.slice(i, i + 2), 16) * factor))
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
