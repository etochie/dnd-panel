import type { AbilityKey } from '../types/character'

export interface ClassDefinition {
  id: string
  name: string
  spellcastingAbility: AbilityKey
  hitDie: number
  /** Уровни улучшения характеристик по таблице класса 2014 */
  asiLevels: number[]
}

export const CLASSES: ClassDefinition[] = [
  {
    id: 'cleric',
    name: 'Жрец',
    spellcastingAbility: 'wis',
    hitDie: 8,
    asiLevels: [4, 8, 12, 16, 19],
  },
]

export function getClassDefinition(classId: string): ClassDefinition | undefined {
  return CLASSES.find((c) => c.id === classId)
}

export interface SubclassDefinition {
  id: string
  classId: string
  name: string
}

export const SUBCLASSES: SubclassDefinition[] = [
  { id: 'death_domain', classId: 'cleric', name: 'Домен Смерти' },
]

export function getSubclassDefinition(id: string | undefined): SubclassDefinition | undefined {
  if (!id) return undefined
  return SUBCLASSES.find((s) => s.id === id)
}

export function subclassesForClass(classId: string): SubclassDefinition[] {
  return SUBCLASSES.filter((s) => s.classId === classId)
}

/** Ячейки заклинаний жреца по уровню, D&D 5e 2014 (полная таблица) */
export const CLERIC_SPELL_SLOTS: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
}

export function buildSpellSlotsForCleric(level: number): { level: number; max: number; current: number }[] {
  const row = CLERIC_SPELL_SLOTS[level] ?? CLERIC_SPELL_SLOTS[1]
  return row
    .map((max, index) => ({ level: index + 1, max, current: max }))
    .filter((s) => s.max > 0)
}
