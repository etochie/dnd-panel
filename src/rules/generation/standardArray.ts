export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export function remainingStandardArray(used: number[]): number[] {
  const leftover = [...STANDARD_ARRAY]
  for (const value of used) {
    const index = leftover.indexOf(value as (typeof STANDARD_ARRAY)[number])
    if (index >= 0) leftover.splice(index, 1)
  }
  return leftover
}

export function isStandardArrayAssignment(scores: number[]): boolean {
  if (scores.length !== 6) return false
  const sorted = [...scores].sort((a, b) => b - a)
  return STANDARD_ARRAY.every((value, index) => value === sorted[index])
}
