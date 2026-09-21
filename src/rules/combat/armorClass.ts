import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { resolveAbilityScores } from '../generation/resolveAbilities'
import { getGrantedProficiencies } from '../classes'
import { findEquippedShield } from './shieldInventory'

export interface ArmorClassResult {
  ac: number
  acWithoutShield: number
  shieldBonusApplied: number
  shieldEquipped: boolean
  shieldProficient: boolean
  breakdown: CalculationBreakdown
}

function hasShieldProficiency(character: Character): boolean {
  const granted = getGrantedProficiencies(character.classId, character.subclassId)
  const armor = [...new Set([...granted.armor, ...character.extraProficiencies.armor])]
  return armor.includes('shield')
}

function baseArmorClassWithoutShield(
  character: Character,
  dexMod: number,
): { ac: number; lines: string[]; armorName?: string } {
  const equippedArmor = character.inventory.find((item) => item.equipped && item.category === 'armor')

  if (!equippedArmor || equippedArmor.armorBaseAc == null) {
    const ac = 10 + dexMod
    const lines = ['Без брони: 10 + модификатор ловкости', `10 + ${formatModifier(dexMod)} = ${ac}`]
    return { ac, lines }
  }

  const base = equippedArmor.armorBaseAc
  let dexPart = 0
  const lines: string[] = [`Броня: ${equippedArmor.name}, база ${base}`]
  if (equippedArmor.armorType === 'light') {
    dexPart = dexMod
    lines.push(`Легкая броня: + модификатор ловкости ${formatModifier(dexMod)}`)
  } else if (equippedArmor.armorType === 'medium') {
    dexPart = Math.min(dexMod, 2)
    lines.push(`Средняя броня: + модификатор ловкости (макс. +2): ${formatModifier(dexPart)}`)
  } else {
    lines.push('Тяжелая броня: модификатор ловкости не добавляется')
  }
  const ac = base + dexPart
  lines.push(`${base} + ${dexPart} = ${ac}`)
  return { ac, lines, armorName: equippedArmor.name }
}

export function calculateArmorClass(character: Character): ArmorClassResult {
  const dexMod = calculateAbilityModifier(resolveAbilityScores(character).scores.dex)
  const equippedShield = findEquippedShield(character)
  const shieldProficient = hasShieldProficiency(character)
  const shieldEquipped = Boolean(equippedShield)
  const rawShieldBonus = equippedShield?.shieldBonus ?? 0
  const shieldBonusApplied =
    shieldEquipped && shieldProficient && rawShieldBonus > 0 ? rawShieldBonus : 0

  const base = baseArmorClassWithoutShield(character, dexMod)
  const acWithoutShield = base.ac
  const ac = acWithoutShield + shieldBonusApplied

  const lines = [...base.lines]
  if (shieldEquipped && !shieldProficient) {
    lines.push('Щит экипирован, но нет владения щитом - бонус не применяется')
  } else if (shieldBonusApplied) {
    lines.push(`Щит: +${shieldBonusApplied}`)
    lines.push(`КД без щита: ${acWithoutShield}`)
    lines.push(`КД со щитом: ${acWithoutShield} + ${shieldBonusApplied} = ${ac}`)
  } else {
    lines.push(`Итоговый КД: ${ac}`)
  }

  return {
    ac,
    acWithoutShield,
    shieldBonusApplied,
    shieldEquipped,
    shieldProficient,
    breakdown: { title: 'Класс брони', result: String(ac), lines },
  }
}

export function calculateInitiative(character: Character): {
  value: number
  breakdown: CalculationBreakdown
} {
  const dexMod = calculateAbilityModifier(resolveAbilityScores(character).scores.dex)
  return {
    value: dexMod,
    breakdown: {
      title: 'Инициатива',
      result: formatModifier(dexMod),
      lines: ['Инициатива = модификатор ловкости', formatModifier(dexMod)],
    },
  }
}

export function calculatePassivePerception(skillBonus: number): CalculationBreakdown {
  const passive = 10 + skillBonus
  return {
    title: 'Пассивное восприятие',
    result: String(passive),
    lines: [
      '10 + бонус навыка "Внимательность"',
      `10 + ${skillBonus >= 0 ? skillBonus : `(${skillBonus})`} = ${passive}`,
    ],
  }
}
