import type { AbilityKey, Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from '../core/abilities'
import { ABILITY_KEYS } from '../core/types'
import { getRacialAbilityBonuses } from '../races'
import { POINT_BUY_LIMIT, pointBuySpent } from './pointBuy'
import { isStandardArrayAssignment } from './standardArray'

export interface AbilityScoreParts {
  key: AbilityKey
  base: number
  racial: number
  asi: number
  total: number
  modifier: number
}

export interface ResolvedAbilities {
  scores: Record<AbilityKey, number>
  parts: Record<AbilityKey, AbilityScoreParts>
  racialLabel: string
  pointBuySpent: number
  pointBuyRemaining: number
}

export function asiIncreasesFromCharacter(character: Character): Record<AbilityKey, number> {
  const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  for (const choice of character.asiChoices ?? []) {
    if (choice.kind !== 'scores') continue
    for (const key of ABILITY_KEYS) {
      totals[key] += choice.increases[key] ?? 0
    }
  }
  return totals
}

export function resolveAbilityScores(character: Character): ResolvedAbilities {
  const racial = getRacialAbilityBonuses(character.raceId)
  const asi = asiIncreasesFromCharacter(character)
  const parts = {} as Record<AbilityKey, AbilityScoreParts>
  const scores = {} as Record<AbilityKey, number>
  const racialBits: string[] = []

  for (const key of ABILITY_KEYS) {
    const base = character.baseAbilities[key]
    const racialBonus = racial[key] ?? 0
    const asiBonus = asi[key]
    const total = base + racialBonus + asiBonus
    parts[key] = {
      key,
      base,
      racial: racialBonus,
      asi: asiBonus,
      total,
      modifier: calculateAbilityModifier(total),
    }
    scores[key] = total
    if (racialBonus) {
      racialBits.push(`${ABILITY_LABELS[key]} ${formatModifier(racialBonus)}`)
    }
  }

  const spent = pointBuySpent(ABILITY_KEYS.map((key) => character.baseAbilities[key]))

  return {
    scores,
    parts,
    racialLabel: racialBits.length > 0 ? `Расовые бонусы: ${racialBits.join(', ')}` : '',
    pointBuySpent: spent,
    pointBuyRemaining: POINT_BUY_LIMIT - spent,
  }
}

export function explainAbilityTotal(part: AbilityScoreParts): CalculationBreakdown {
  const lines = [
    `Базовое значение: ${part.base}`,
    part.racial
      ? `Расовый бонус: ${formatModifier(part.racial)}`
      : 'Расовый бонус: нет',
  ]
  if (part.asi) lines.push(`Улучшение характеристик: ${formatModifier(part.asi)}`)
  lines.push(`Итог: ${part.total}`)
  lines.push(`Модификатор: (${part.total} - 10) / 2 = ${formatModifier(part.modifier)}`)
  return {
    title: ABILITY_LABELS[part.key],
    result: `${part.total} (${formatModifier(part.modifier)})`,
    lines,
  }
}

export function isStandardArrayCharacter(character: Character): boolean {
  return isStandardArrayAssignment(ABILITY_KEYS.map((key) => character.baseAbilities[key]))
}
