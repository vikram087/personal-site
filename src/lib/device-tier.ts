export function pickTier(input: { cores: number; memoryGb?: number }): 'high' | 'low' {
  if (input.cores < 4) return 'low'
  if (input.memoryGb !== undefined && input.memoryGb < 4) return 'low'
  return 'high'
}
