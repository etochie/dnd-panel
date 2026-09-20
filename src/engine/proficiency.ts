import type { CalculationBreakdown } from '../types/explain'
import { formatModifier } from './abilities'

/** D&D 5e 2014 proficiency bonus by character level */
export function calculateProficiencyBonus(level: number): number {
  if (level <= 4) return 2
  if (level <= 8) return 3
  if (level <= 12) return 4
  if (level <= 16) return 5
  return 6
}

export function explainProficiencyBonus(level: number): CalculationBreakdown {
  const bonus = calculateProficiencyBonus(level)
  return {
    title: 'Бонус мастерства',
    result: formatModifier(bonus),
    lines: [
      `Уровень персонажа: ${level}`,
      `По таблице D&D 5e 2014: ${formatModifier(bonus)}`,
    ],
  }
}
