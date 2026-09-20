import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getProficiencyBonus } from '../core/proficiency'
import { getClassDefinition } from '../classes'
import { resolveAbilityScores } from '../generation/resolveAbilities'

export function calculateSpellSaveDC(
  character: Character,
  spellcastingMod?: number,
): { dc: number; breakdown: CalculationBreakdown } {
  const classDef = getClassDefinition(character.classId)
  const abilityKey = classDef?.spellcastingAbility ?? 'wis'
  const scores = resolveAbilityScores(character).scores
  const mod = spellcastingMod ?? calculateAbilityModifier(scores[abilityKey])
  const prof =
    character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level)
  const rulesDc = 8 + prof + mod
  const dc = character.overrides.spellSaveDc ?? rulesDc
  return {
    dc,
    breakdown: {
      title: 'Сложность спасброска заклинаний',
      result: String(dc),
      lines: [
        `Характеристика заклинаний: ${ABILITY_LABELS[abilityKey]}`,
        '8 + бонус мастерства + модификатор мудрости',
        `8 + ${prof} + ${formatModifier(mod)} = ${rulesDc}`,
        ...(character.overrides.spellSaveDc != null
          ? [`Используется ручное значение: ${dc}. Автоматический расчет: ${rulesDc}.`]
          : []),
      ],
    },
  }
}

export function calculateSpellAttackBonus(
  character: Character,
  spellcastingMod?: number,
): { bonus: number; breakdown: CalculationBreakdown } {
  const classDef = getClassDefinition(character.classId)
  const abilityKey = classDef?.spellcastingAbility ?? 'wis'
  const scores = resolveAbilityScores(character).scores
  const mod = spellcastingMod ?? calculateAbilityModifier(scores[abilityKey])
  const prof =
    character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level)
  const rulesBonus = prof + mod
  const bonus = character.overrides.spellAttackBonus ?? rulesBonus
  return {
    bonus,
    breakdown: {
      title: 'Бонус атаки заклинанием',
      result: formatModifier(bonus),
      lines: [
        `Характеристика заклинаний: ${ABILITY_LABELS[abilityKey]}`,
        'Бонус мастерства + модификатор мудрости',
        `${formatModifier(prof)} + ${formatModifier(mod)} = ${formatModifier(rulesBonus)}`,
        ...(character.overrides.spellAttackBonus != null
          ? [`Используется ручное значение: ${formatModifier(bonus)}.`]
          : []),
      ],
    },
  }
}
