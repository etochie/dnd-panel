import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { resolveAbilityScores } from '../generation/resolveAbilities'

export function calculateArmorClass(character: Character): {
  ac: number
  breakdown: CalculationBreakdown
} {
  const dexMod = calculateAbilityModifier(resolveAbilityScores(character).scores.dex)
  const equippedArmor = character.inventory.find((item) => item.equipped && item.category === 'armor')
  const equippedShield = character.inventory.find((item) => item.equipped && item.category === 'shield')
  const shieldBonus = equippedShield?.shieldBonus ?? 0

  if (!equippedArmor || equippedArmor.armorBaseAc == null) {
    const ac = 10 + dexMod + shieldBonus
    const lines = ['Без брони: 10 + модификатор ловкости']
    if (shieldBonus) lines.push(`Щит: +${shieldBonus}`)
    lines.push(`10 + ${formatModifier(dexMod)}${shieldBonus ? ` + ${shieldBonus}` : ''} = ${ac}`)
    return {
      ac,
      breakdown: { title: 'Класс брони', result: String(ac), lines },
    }
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
  const ac = base + dexPart + shieldBonus
  if (shieldBonus) lines.push(`Щит: +${shieldBonus}`)
  lines.push(`${base} + ${dexPart}${shieldBonus ? ` + ${shieldBonus}` : ''} = ${ac}`)
  return {
    ac,
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
