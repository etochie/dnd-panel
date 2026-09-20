export const POINT_BUY_LIMIT = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export function pointBuyCostForScore(score: number): number {
  if (score <= POINT_BUY_MIN) return 0
  if (score >= POINT_BUY_MAX) return POINT_BUY_COST[POINT_BUY_MAX]
  return POINT_BUY_COST[score] ?? 0
}

export function pointBuySpent(scores: number[]): number {
  return scores.reduce((sum, score) => sum + pointBuyCostForScore(score), 0)
}

export function isValidPointBuyScore(score: number): boolean {
  return Number.isInteger(score) && score >= POINT_BUY_MIN && score <= POINT_BUY_MAX
}
