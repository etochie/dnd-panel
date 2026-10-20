import type { Character } from '../../types/character'
import { getProficiencyBonus } from '../core/proficiency'

/**
 * Праведное восстановление (Harness Divine Power), опциональное умение жреца 2 уровня (TCE).
 * Тратит одно использование Божественного канала и одно использование самого умения.
 */
export const HARNESS_RESOURCE_ID = 'harness_divine_power'
export const CHANNEL_RESOURCE_ID = 'channel_divinity'

/** Число использований умения: 1 на 2 уровне, 2 на 6, 3 на 18 */
export function harnessUses(level: number): number {
  if (level < 2) return 0
  if (level >= 18) return 3
  if (level >= 6) return 2
  return 1
}

/** Максимальный круг возвращаемой ячейки: половина бонуса мастерства с округлением вверх */
export function harnessMaxSlotLevel(proficiencyBonus: number): number {
  return Math.ceil(proficiencyBonus / 2)
}

export function harnessMaxSlotLevelForCharacter(character: Pick<Character, 'level'>): number {
  return harnessMaxSlotLevel(getProficiencyBonus(character.level))
}

/** Круги потраченных ячеек, которые можно вернуть этим умением */
export function harnessRestorableSlotLevels(
  character: Pick<Character, 'level' | 'spellSlots'>,
): number[] {
  const maxLevel = harnessMaxSlotLevelForCharacter(character)
  return character.spellSlots
    .filter((slot) => slot.level <= maxLevel && slot.current < slot.max)
    .map((slot) => slot.level)
}

export type HarnessResult =
  | { ok: true; character: Character }
  | { ok: false; reason: string }

export function applyHarnessDivinePower(character: Character, slotLevel: number): HarnessResult {
  if (character.classId !== 'cleric' || harnessUses(character.level) === 0) {
    return { ok: false, reason: 'Праведное восстановление доступно жрецу со 2 уровня.' }
  }
  const maxLevel = harnessMaxSlotLevelForCharacter(character)
  if (slotLevel > maxLevel) {
    return {
      ok: false,
      reason: `Можно вернуть ячейку не выше ${maxLevel} круга (половина бонуса мастерства с округлением вверх).`,
    }
  }
  const channel = character.resources.find((item) => item.id === CHANNEL_RESOURCE_ID)
  if (!channel || channel.current <= 0) {
    return { ok: false, reason: 'Нет доступных использований Божественного канала.' }
  }
  const harness = character.resources.find((item) => item.id === HARNESS_RESOURCE_ID)
  if (!harness || harness.current <= 0) {
    return { ok: false, reason: 'Использования Праведного восстановления закончились до продолжительного отдыха.' }
  }
  const slot = character.spellSlots.find((item) => item.level === slotLevel)
  if (!slot || slot.current >= slot.max) {
    return { ok: false, reason: `Нет потраченной ячейки ${slotLevel} круга.` }
  }
  return {
    ok: true,
    character: {
      ...character,
      resources: character.resources.map((item) =>
        item.id === CHANNEL_RESOURCE_ID || item.id === HARNESS_RESOURCE_ID
          ? { ...item, current: item.current - 1 }
          : item,
      ),
      spellSlots: character.spellSlots.map((item) =>
        item.level === slotLevel ? { ...item, current: item.current + 1 } : item,
      ),
    },
  }
}
