import type { CalculationBreakdown } from '../../types/explain'
import { formatModifier } from './abilities'

/** Бонус мастерства по общему уровню персонажа, D&D 5e 2014 */
export function getProficiencyBonus(level: number): number {
  const clamped = Math.min(20, Math.max(1, level))
  if (clamped <= 4) return 2
  if (clamped <= 8) return 3
  if (clamped <= 12) return 4
  if (clamped <= 16) return 5
  return 6
}

export function calculateProficiencyBonus(level: number): number {
  return getProficiencyBonus(level)
}

export function explainProficiencyBonus(level: number): CalculationBreakdown {
  const bonus = getProficiencyBonus(level)
  return {
    title: 'Бонус мастерства',
    result: formatModifier(bonus),
    lines: [
      `Общий уровень персонажа: ${level}`,
      'Таблица 2014: 1-4 = +2, 5-8 = +3, 9-12 = +4, 13-16 = +5, 17-20 = +6',
      `Итог: ${formatModifier(bonus)}`,
    ],
  }
}
