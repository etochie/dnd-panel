import { feetToMeters } from '../../data/distances'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from '../core/abilities'
import type { BreathWeaponInfo, DragonAncestry, RaceDefinition } from './types'

export const DRAGONBORN_ANCESTRIES: DragonAncestry[] = [
  { id: 'black', name: 'Черный дракон', damageType: 'кислота', damageTypeId: 'acid', breathShape: 'line', breathFeet: 30, lineWidthFeet: 5, saveAbility: 'dex' },
  { id: 'blue', name: 'Синий дракон', damageType: 'электричество', damageTypeId: 'lightning', breathShape: 'line', breathFeet: 30, lineWidthFeet: 5, saveAbility: 'dex' },
  { id: 'brass', name: 'Латунный дракон', damageType: 'огонь', damageTypeId: 'fire', breathShape: 'line', breathFeet: 30, lineWidthFeet: 5, saveAbility: 'dex' },
  { id: 'bronze', name: 'Бронзовый дракон', damageType: 'электричество', damageTypeId: 'lightning', breathShape: 'line', breathFeet: 30, lineWidthFeet: 5, saveAbility: 'dex' },
  { id: 'copper', name: 'Медный дракон', damageType: 'кислота', damageTypeId: 'acid', breathShape: 'line', breathFeet: 30, lineWidthFeet: 5, saveAbility: 'dex' },
  { id: 'gold', name: 'Золотой дракон', damageType: 'огонь', damageTypeId: 'fire', breathShape: 'cone', breathFeet: 15, saveAbility: 'dex' },
  { id: 'green', name: 'Зеленый дракон', damageType: 'яд', damageTypeId: 'poison', breathShape: 'cone', breathFeet: 15, saveAbility: 'con' },
  { id: 'red', name: 'Красный дракон', damageType: 'огонь', damageTypeId: 'fire', breathShape: 'cone', breathFeet: 15, saveAbility: 'dex' },
  { id: 'silver', name: 'Серебряный дракон', damageType: 'холод', damageTypeId: 'cold', breathShape: 'cone', breathFeet: 15, saveAbility: 'con' },
  { id: 'white', name: 'Белый дракон', damageType: 'холод', damageTypeId: 'cold', breathShape: 'cone', breathFeet: 15, saveAbility: 'con' },
]

export function breathDiceCount(level: number): number {
  if (level >= 16) return 5
  if (level >= 11) return 4
  if (level >= 6) return 3
  return 2
}

export function getDragonbornAncestry(id: string | undefined): DragonAncestry | undefined {
  if (!id) return undefined
  return DRAGONBORN_ANCESTRIES.find((item) => item.id === id)
}

export function getDragonbornBreath(
  level: number,
  ancestryId: string | undefined,
  constitution: number,
  proficiencyBonus: number,
): BreathWeaponInfo | null {
  const ancestry = getDragonbornAncestry(ancestryId)
  if (!ancestry) return null
  const dice = breathDiceCount(level)
  const conMod = calculateAbilityModifier(constitution)
  const saveDc = 8 + conMod + proficiencyBonus
  const area =
    ancestry.breathShape === 'cone'
      ? `конус ${feetToMeters(ancestry.breathFeet)}`
      : `линия ${feetToMeters(ancestry.breathFeet)} × ${feetToMeters(ancestry.lineWidthFeet ?? 5)}`
  return {
    damageType: ancestry.damageType,
    area,
    save: ABILITY_LABELS[ancestry.saveAbility],
    saveDc,
    damage: `${dice}d6 ${ancestry.damageType}`,
    dice,
    dieSize: 6,
    uses: '1',
    recharge: 'короткий или продолжительный отдых',
    breakdownLines: [
      `Родословная: ${ancestry.name}`,
      `Тип урона: ${ancestry.damageType}`,
      `Область: ${area} (в правилах ${ancestry.breathFeet} футов)`,
      `Спасбросок: ${ABILITY_LABELS[ancestry.saveAbility]}`,
      `Сл спасброска: 8 + телосложение ${formatModifier(conMod)} + мастерство ${formatModifier(proficiencyBonus)} = ${saveDc}`,
      `Урон по таблице 2014: 2d6 на 1-5, 3d6 на 6-10, 4d6 на 11-15, 5d6 на 16-20`,
      `На ${level} уровне: ${dice}d6`,
      'Одно использование, восстанавливается после короткого или продолжительного отдыха.',
    ],
  }
}

export const DRAGONBORN_RACE: RaceDefinition = {
  id: 'dragonborn',
  name: 'Драконорожденный',
  speedFeet: 30,
  abilityScoreIncrease: { str: 2, cha: 1 },
  languages: ['common', 'draconic'],
  needsAncestry: true,
  ancestries: DRAGONBORN_ANCESTRIES,
  features: [
    {
      id: 'dragonborn_asi',
      name: 'Увеличение характеристик',
      level: 1,
      description: 'Сила +2, харизма +1.',
      actionType: 'пассивно',
    },
    {
      id: 'dragonborn_resistance',
      name: 'Сопротивление урону',
      level: 1,
      description: 'Сопротивление типу урона выбранной драконьей родословной.',
      actionType: 'пассивно',
    },
    {
      id: 'dragonborn_breath',
      name: 'Оружие дыхания',
      level: 1,
      description:
        'Действием выдыхает энергию родословной. Цели в области делают спасбросок, Сл 8 + телосложение + мастерство. При успехе урон делится пополам. Урон растет на 6, 11 и 16 уровнях.',
      actionType: 'action',
      resourceId: 'breath_weapon',
      limits: '1 раз, короткий или продолжительный отдых',
    },
  ],
}

export function ancestryIdFromLegacy(lineage?: string, breathType?: string): string | undefined {
  if (!lineage && !breathType) return undefined
  const text = `${lineage ?? ''} ${breathType ?? ''}`.toLowerCase()
  if (text.includes('серебр') || text.includes('холод') || text.includes('silver')) return 'silver'
  const match = DRAGONBORN_ANCESTRIES.find(
    (item) =>
      text.includes(item.name.toLowerCase()) ||
      text.includes(item.damageType) ||
      text.includes(item.id),
  )
  return match?.id
}

