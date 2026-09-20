import type { Character, SpellSlotState } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { getClassDefinition, getClassSpellSlots } from '../classes'

export function getSpellSlots(classId: string, level: number): SpellSlotState[] {
  const row = getClassSpellSlots(classId, level)
  return row
    .map((max, index) => ({ level: index + 1, max, current: max }))
    .filter((slot) => slot.max > 0)
}

export function mergeSpellSlotUsage(
  classId: string,
  level: number,
  existing: SpellSlotState[],
): SpellSlotState[] {
  return getSpellSlots(classId, level).map((slot) => {
    const old = existing.find((item) => item.level === slot.level)
    return {
      level: slot.level,
      max: slot.max,
      current: old ? Math.min(old.current, slot.max) : slot.max,
    }
  })
}

export function maxSpellSlotLevel(slots: SpellSlotState[]): number {
  return slots.reduce((max, slot) => (slot.max > 0 ? Math.max(max, slot.level) : max), 0)
}

export function explainSpellSlots(character: Character): CalculationBreakdown {
  const className = getClassDefinition(character.classId)?.name ?? 'класс'
  const slots = getSpellSlots(character.classId, character.level)
  const lines = slots.map((slot) => `${slot.level} уровень: ${slot.max}`)
  if (lines.length === 0) {
    lines.push('На этом уровне ячеек нет.')
  }
  lines.unshift(`Таблица заклинателя для класса "${className}", уровень ${character.level}.`)
  lines.push('Ячейки более высокого круга не показываются, пока персонаж их не получил.')
  return {
    title: 'Ячейки заклинаний',
    result: slots.map((slot) => `${slot.level}:${slot.max}`).join(' · ') || 'нет',
    lines,
  }
}
