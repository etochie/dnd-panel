import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getCantripsKnown, getClassDefinition, getPreparedSpellCount } from '../classes'
import { resolveAbilityScores } from '../generation/resolveAbilities'
import { getSpellSlots, maxSpellSlotLevel } from './slots'

export function preparedSpellLimitForCharacter(character: Character): {
  limit: number
  cantripsKnown: number
  maxSlotLevel: number
  breakdown: CalculationBreakdown
} {
  const classDef = getClassDefinition(character.classId)
  const abilityKey = classDef?.spellcastingAbility ?? 'wis'
  const scores = resolveAbilityScores(character).scores
  const abilityMod = calculateAbilityModifier(scores[abilityKey])
  const isCleric = character.classId === 'cleric'
  const limit = isCleric ? getPreparedSpellCount(character.classId, character.level, abilityMod) : 0
  const cantripsKnown = isCleric ? getCantripsKnown(character.classId, character.level) : 0
  const slots = getSpellSlots(character.classId, character.level)
  const maxSlotLevel = maxSpellSlotLevel(slots)

  return {
    limit,
    cantripsKnown,
    maxSlotLevel,
    breakdown: {
      title: 'Число подготовленных заклинаний',
      result: String(limit),
      lines: isCleric
        ? [
            'Жрец, правила 2014: уровень жреца + модификатор мудрости, минимум 1.',
            `Уровень жреца: ${character.level}`,
            `Мудрость ${scores.wis}, модификатор ${formatModifier(abilityMod)}`,
            `${character.level} + ${formatModifier(abilityMod)} = ${character.level + abilityMod}`,
            `Итог с минимумом 1: ${limit}`,
            'Заклинания домена всегда подготовлены и не занимают эти места.',
          ]
        : ['Для этого класса нет таблицы подготовки 2014 в данных приложения.'],
    },
  }
}
