import { getClassDefinition } from '../data/classes'
import type { Character } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { calculateAbilityModifier, formatModifier } from './abilities'

function averageHitDie(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
}

function hpGainForLevel(hitDie: number, conMod: number, isFirstLevel: boolean): number {
  const base = isFirstLevel ? hitDie : averageHitDie(hitDie)
  return Math.max(1, base + conMod)
}

export function calculateRulesMaxHp(character: Character): {
  value: number
  breakdown: CalculationBreakdown
} {
  const classDef = getClassDefinition(character.classId)
  const hitDie = classDef?.hitDie ?? character.hitDieSize
  const className = classDef?.name ?? 'класс'
  const con = character.abilities.con
  const conMod = calculateAbilityModifier(con)
  const average = averageHitDie(hitDie)
  const level = Math.min(20, Math.max(1, character.level))

  const lines: string[] = [
    `${className}: кость хитов d${hitDie}`,
    `Телосложение ${con}, модификатор ${formatModifier(conMod)}`,
    `1 уровень: максимум кости ${hitDie} + телосложение ${formatModifier(conMod)} = ${hpGainForLevel(hitDie, conMod, true)}`,
  ]

  let total = hpGainForLevel(hitDie, conMod, true)
  if (level > 1) {
    const perLevel = hpGainForLevel(hitDie, conMod, false)
    const extraLevels = level - 1
    total += extraLevels * perLevel
    lines.push(
      `Со 2 уровня: среднее кости ${average} + телосложение ${formatModifier(conMod)} = ${perLevel} за уровень`,
    )
    lines.push(`Уровни 2-${level}: ${extraLevels} × ${perLevel} = ${extraLevels * perLevel}`)
  }
  lines.push(`Итого по правилам: ${total}`)
  if (conMod < 0) {
    lines.push('За уровень всегда добавляется хотя бы 1 хит.')
  }

  return {
    value: total,
    breakdown: {
      title: 'Максимум хитов',
      result: String(total),
      lines,
    },
  }
}

export function effectiveMaxHp(character: Character): number {
  return character.maxHpOverride ?? calculateRulesMaxHp(character).value
}

export function explainEffectiveMaxHp(character: Character): CalculationBreakdown {
  const rules = calculateRulesMaxHp(character)
  if (character.maxHpOverride == null) return rules.breakdown
  return {
    title: 'Максимум хитов',
    result: String(character.maxHpOverride),
    lines: [
      ...rules.breakdown.lines,
      `Сейчас используется ручное значение: ${character.maxHpOverride}`,
    ],
  }
}
