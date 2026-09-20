import type { AbilityKey } from '../../types/character'
import type { RuleFeature } from '../core/types'
import type { ClassDefinition, ClassProgressionRow } from './types'

/** Ячейки заклинаний полного заклинателя-жреца, PHB 2014 */
const SPELL_SLOTS: Record<number, number[]> = {
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

function cantripsKnown(level: number): number {
  if (level >= 10) return 5
  if (level >= 4) return 4
  return 3
}

function channelDivinityUses(level: number): number {
  if (level < 2) return 0
  if (level >= 18) return 3
  if (level >= 6) return 2
  return 1
}

function destroyUndeadCr(level: number): string | null {
  if (level >= 17) return '4'
  if (level >= 14) return '3'
  if (level >= 11) return '2'
  if (level >= 8) return '1'
  if (level >= 5) return '1/2'
  return null
}

const CLASS_FEATURES: RuleFeature[] = [
  {
    id: 'cleric_spellcasting',
    name: 'Использование заклинаний',
    level: 1,
    description:
      'Жрец готовит заклинания из своего списка. Характеристика заклинаний - мудрость. Ячейки восстанавливаются после продолжительного отдыха.',
    actionType: 'зависит от заклинания',
  },
  {
    id: 'cleric_domain',
    name: 'Божественный домен',
    level: 1,
    description: 'На 1 уровне жрец выбирает домен. Домен дает дополнительные заклинания и способности.',
    actionType: 'пассивно',
  },
  {
    id: 'cleric_channel',
    name: 'Божественный канал',
    level: 2,
    description:
      'Жрец получает Божественный канал. Число использований растет с уровнем: 1 на 2 уровне, 2 на 6, 3 на 18. Восстанавливается после короткого или продолжительного отдыха.',
    actionType: 'зависит от варианта',
    resourceId: 'channel_divinity',
    limits: 'Короткий или продолжительный отдых',
  },
  {
    id: 'cleric_turn_undead',
    name: 'Изгнание нежити',
    level: 2,
    description:
      'Вариант Божественного канала: существа-нежить в пределах 9 м должны пройти спасбросок мудрости или быть изгнаны на 1 минуту.',
    actionType: 'action',
    resourceId: 'channel_divinity',
  },
  {
    id: 'cleric_destroy_undead',
    name: 'Уничтожение нежити',
    level: 5,
    description:
      'Если нежить с рейтингом опасности не выше порога проваливает спасбросок против Изгнания, она уничтожается. Порог растет на 5, 8, 11, 14 и 17 уровнях.',
    actionType: 'пассивно',
  },
  {
    id: 'cleric_divine_intervention',
    name: 'Божественное вмешательство',
    level: 10,
    description:
      'Раз в день жрец может воззвать к божеству. Успех определяется броском d100: результат не должен превышать уровень жреца. На 20 уровне успех автоматический.',
    actionType: 'action',
    limits: 'Повторно - после продолжительного отдыха, если сработало; иначе через 7 дней.',
  },
]

function buildProgression(): Record<number, ClassProgressionRow> {
  const rows: Record<number, ClassProgressionRow> = {}
  for (let level = 1; level <= 20; level += 1) {
    const features: string[] = []
    if (level === 1) features.push('Использование заклинаний', 'Божественный домен')
    if (level === 2) features.push('Божественный канал (1)', 'Изгнание нежити')
    if (level === 5) features.push('Уничтожение нежити')
    if (level === 6) features.push('Божественный канал (2)')
    if (level === 10) features.push('Божественное вмешательство')
    if (level === 18) features.push('Божественный канал (3)')
    if ([4, 8, 12, 16, 19].includes(level)) features.push('Улучшение характеристик')
    const cr = destroyUndeadCr(level)
    rows[level] = {
      level,
      cantripsKnown: cantripsKnown(level),
      spellSlots: SPELL_SLOTS[level],
      features,
      channelDivinity: channelDivinityUses(level),
      destroyUndeadCr: cr,
    }
  }
  return rows
}

export const CLERIC_CLASS: ClassDefinition = {
  id: 'cleric',
  name: 'Жрец',
  hitDie: 8,
  spellcastingAbility: 'wis' as AbilityKey,
  spellcastingKind: 'full',
  saveProficiencies: ['wis', 'cha'],
  armorProficiencies: ['light', 'medium', 'shield'],
  weaponProficiencies: ['simple'],
  skillChoices: {
    count: 2,
    options: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
  },
  asiLevels: [4, 8, 12, 16, 19],
  subclassLevel: 1,
  features: CLASS_FEATURES,
  progression: buildProgression(),
}

export function getClericSpellSlots(level: number): number[] {
  return SPELL_SLOTS[Math.min(20, Math.max(1, level))] ?? SPELL_SLOTS[1]
}

export function getClericCantripsKnown(level: number): number {
  return cantripsKnown(level)
}

export function getClericChannelDivinityUses(level: number): number {
  return channelDivinityUses(level)
}
