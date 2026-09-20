import type { Character, SpellSlotState } from '../types/character'
import { getClassDefinition } from '../data/classes'
import { calculateAbilityModifier } from './abilities'
import type { CalculationBreakdown } from '../types/explain'
import { formatModifier } from './abilities'

/** Известные заговоры жреца по таблице класса, PHB 2014 */
export function clericCantripsKnown(level: number): number {
  if (level >= 10) return 5
  if (level >= 4) return 4
  return 3
}

/**
 * Сколько заклинаний жрец готовит за длинный отдых.
 * PHB 2014: модификатор мудрости + уровень жреца, минимум 1.
 * Доменные заклинания в это число не входят.
 */
export function clericPreparedLimit(level: number, wisdomModifier: number): number {
  return Math.max(1, wisdomModifier + level)
}

export function maxSpellSlotLevel(slots: SpellSlotState[]): number {
  return slots.reduce((max, slot) => (slot.max > 0 ? Math.max(max, slot.level) : max), 0)
}

export function preparedSpellLimitForCharacter(character: Character): {
  limit: number
  cantripsKnown: number
  maxSlotLevel: number
  breakdown: CalculationBreakdown
} {
  const classDef = getClassDefinition(character.classId)
  const abilityKey = classDef?.spellcastingAbility ?? 'wis'
  const abilityMod = calculateAbilityModifier(character.abilities[abilityKey])
  const isCleric = character.classId === 'cleric'
  const limit = isCleric ? clericPreparedLimit(character.level, abilityMod) : 0
  const cantripsKnown = isCleric ? clericCantripsKnown(character.level) : 0
  const maxSlotLevel = maxSpellSlotLevel(character.spellSlots)

  const breakdown: CalculationBreakdown = {
    title: 'Число подготовленных заклинаний',
    result: String(limit),
    lines: isCleric
      ? [
          'Жрец, правила 2014: модификатор мудрости + уровень жреца, минимум 1.',
          `Мудрость: ${formatModifier(abilityMod)}`,
          `Уровень жреца: ${character.level}`,
          `${formatModifier(abilityMod)} + ${character.level} = ${abilityMod + character.level}`,
          `Итог с минимумом 1: ${limit}`,
          'Доменные заклинания всегда подготовлены и не занимают эти места.',
          'Можно готовить только заклинания тех кругов, для которых есть ячейки.',
        ]
      : ['Для этого класса нет таблицы подготовки 2014 в данных приложения.'],
  }

  return { limit, cantripsKnown, maxSlotLevel, breakdown }
}
