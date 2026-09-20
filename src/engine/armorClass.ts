import type { Character } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { calculateAbilityModifier, formatModifier } from './abilities'
import { calculateProficiencyBonus } from './proficiency'

export function calculateArmorClass(character: Character): {
  ac: number
  breakdown: CalculationBreakdown
} {
  const dexMod = calculateAbilityModifier(character.abilities.dex)
  const equippedArmor = character.inventory.find(
    (i) => i.equipped && i.category === 'armor',
  )
  const equippedShield = character.inventory.find(
    (i) => i.equipped && i.category === 'shield',
  )
  const shieldBonus = equippedShield?.shieldBonus ?? 0

  if (!equippedArmor || equippedArmor.armorBaseAc == null) {
    const ac = 10 + dexMod + shieldBonus
    const lines = ['Без брони: 10 + модификатор ловкости']
    if (shieldBonus) lines.push(`Щит: +${shieldBonus}`)
    lines.push(`10 + ${formatModifier(dexMod)}${shieldBonus ? ` + ${shieldBonus}` : ''} = ${ac}`)
    return {
      ac,
      breakdown: {
        title: 'Класс брони',
        result: String(ac),
        lines,
      },
    }
  }

  const base = equippedArmor.armorBaseAc
  let dexPart = 0
  const lines: string[] = [`Броня: ${equippedArmor.name}, база ${base}`]

  if (equippedArmor.armorType === 'light') {
    dexPart = dexMod
    lines.push(`Лёгкая броня: + модификатор ловкости ${formatModifier(dexMod)}`)
  } else if (equippedArmor.armorType === 'medium') {
    dexPart = Math.min(dexMod, 2)
    lines.push(
      `Средняя броня: + модификатор ловкости (макс. +2): ${formatModifier(dexPart)}`,
    )
  } else {
    lines.push('Тяжёлая броня: модификатор ловкости не добавляется')
  }

  const ac = base + dexPart + shieldBonus
  if (shieldBonus) lines.push(`Щит: +${shieldBonus}`)
  lines.push(`${base} + ${dexPart}${shieldBonus ? ` + ${shieldBonus}` : ''} = ${ac}`)

  return {
    ac,
    breakdown: {
      title: 'Класс брони',
      result: String(ac),
      lines,
    },
  }
}

export function calculateInitiative(character: Character): {
  value: number
  breakdown: CalculationBreakdown
} {
  const dexMod = calculateAbilityModifier(character.abilities.dex)
  return {
    value: dexMod,
    breakdown: {
      title: 'Инициатива',
      result: formatModifier(dexMod),
      lines: [
        'Инициатива = модификатор ловкости',
        formatModifier(dexMod),
      ],
    },
  }
}

export function calculatePassivePerception(skillBonus: number): CalculationBreakdown {
  const passive = 10 + skillBonus
  return {
    title: 'Пассивное восприятие',
    result: String(passive),
    lines: [
      '10 + бонус навыка «Внимательность»',
      `10 + ${skillBonus >= 0 ? skillBonus : `(${skillBonus})`} = ${passive}`,
    ],
  }
}

export function calculateSpellSaveDC(
  character: Character,
  spellcastingMod: number,
): { dc: number; breakdown: CalculationBreakdown } {
  const prof = calculateProficiencyBonus(character.level)
  const dc = 8 + prof + spellcastingMod
  return {
    dc,
    breakdown: {
      title: 'Сложность спасброска заклинаний',
      result: String(dc),
      lines: [
        '8 + бонус мастерства + модификатор заклинательной характеристики',
        `8 + ${prof} + ${formatModifier(spellcastingMod)} = ${dc}`,
      ],
    },
  }
}

export function calculateSpellAttackBonus(
  character: Character,
  spellcastingMod: number,
): { bonus: number; breakdown: CalculationBreakdown } {
  const prof = calculateProficiencyBonus(character.level)
  const bonus = prof + spellcastingMod
  return {
    bonus,
    breakdown: {
      title: 'Бонус атаки заклинанием',
      result: formatModifier(bonus),
      lines: [
        'Бонус мастерства + модификатор заклинательной характеристики',
        `${formatModifier(prof)} + ${formatModifier(spellcastingMod)} = ${formatModifier(bonus)}`,
      ],
    },
  }
}
