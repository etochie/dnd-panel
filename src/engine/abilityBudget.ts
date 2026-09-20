import type { Character } from '../types/character'
import { explainAsiStatus, POINT_BUY_LIMIT, resolveAbilityScores } from '../rules'

/** Сохранен для старых импортов. ASI больше не выводится из итоговых чисел. */
export function calculateAbilityBudget(character: Character) {
  const resolved = resolveAbilityScores(character)
  const asi = explainAsiStatus(character)
  return {
    className: '',
    level: character.level,
    pointBuyLimit: POINT_BUY_LIMIT,
    pointBuySpent: resolved.pointBuySpent,
    pointBuyRemaining: resolved.pointBuyRemaining,
    asiLevels: [],
    asiGained: 0,
    asiPointsAvailable: 0,
    asiPointsSpent: 0,
    asiRemaining: 0,
    racialLabel: resolved.racialLabel,
    breakdown: asi,
  }
}
