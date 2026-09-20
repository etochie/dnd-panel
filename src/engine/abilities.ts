import type { AbilityKey } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
}

export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function explainAbilityModifier(
  key: AbilityKey,
  score: number,
): CalculationBreakdown {
  const mod = calculateAbilityModifier(score)
  return {
    title: `Модификатор ${ABILITY_LABELS[key]}`,
    result: formatModifier(mod),
    lines: [
      `${ABILITY_LABELS[key]} = ${score}`,
      `(${score} - 10) / 2 = ${formatModifier(mod)}`,
    ],
  }
}
