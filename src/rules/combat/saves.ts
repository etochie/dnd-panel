import type { AbilityKey, Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getProficiencyBonus } from '../core/proficiency'
import { getClassSaveProficiencies } from '../classes'
import { resolveAbilityScores } from '../generation/resolveAbilities'

const SAVE_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export interface SaveResult {
  key: AbilityKey
  label: string
  bonus: number
  proficient: boolean
  breakdown: CalculationBreakdown
}

export function getEffectiveSaveProficiencies(character: Character): AbilityKey[] {
  const fromClass = getClassSaveProficiencies(character.classId)
  const extra = character.extraSaveProficiencies ?? []
  return [...new Set([...fromClass, ...extra])]
}

export function calculateSavingThrow(character: Character, key: AbilityKey): SaveResult {
  const mod = calculateAbilityModifier(resolveAbilityScores(character).scores[key])
  const proficient = getEffectiveSaveProficiencies(character).includes(key)
  const prof = proficient
    ? (character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level))
    : 0
  const bonus = mod + prof
  const lines = [`Модификатор ${ABILITY_LABELS[key]}: ${formatModifier(mod)}`]
  if (proficient) lines.push(`Владение спасброском: ${formatModifier(prof)}`)
  else lines.push('Нет владения спасброском')
  lines.push(`Итого: ${formatModifier(bonus)}`)
  return {
    key,
    label: ABILITY_LABELS[key],
    bonus,
    proficient,
    breakdown: {
      title: `Спасбросок ${ABILITY_LABELS[key]}`,
      result: formatModifier(bonus),
      lines,
    },
  }
}

export function calculateAllSavingThrows(character: Character): SaveResult[] {
  return SAVE_KEYS.map((key) => calculateSavingThrow(character, key))
}
