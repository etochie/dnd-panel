import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getClassDefinition, getClassHitDie } from '../classes'
import { resolveAbilityScores } from '../generation/resolveAbilities'

function averageHitDie(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
}

function gainForLevel(
  hitDie: number,
  conMod: number,
  isFirstLevel: boolean,
  rolledValue?: number,
): { base: number; total: number; label: string } {
  const diePart = isFirstLevel ? hitDie : (rolledValue ?? averageHitDie(hitDie))
  const total = Math.max(1, diePart + conMod)
  const label = isFirstLevel
    ? `${hitDie} + CON (${formatModifier(conMod)}) = ${total}`
    : `${diePart} + CON (${formatModifier(conMod)}) = ${total}`
  return { base: diePart, total, label }
}

export interface HpLevelLine {
  level: number
  base: number
  conMod: number
  total: number
  label: string
}

export interface HpCalculation {
  value: number
  hitDie: number
  method: Character['hpCalculationMethod']
  usingOverride: boolean
  rulesValue: number
  lines: HpLevelLine[]
  breakdown: CalculationBreakdown
}

export function calculateRulesMaxHp(character: Character): HpCalculation {
  const classDef = getClassDefinition(character.classId)
  const hitDie = classDef?.hitDie ?? getClassHitDie(character.classId)
  const className = classDef?.name ?? 'класс'
  const con = resolveAbilityScores(character).scores.con
  const conMod = calculateAbilityModifier(con)
  const level = Math.min(20, Math.max(1, character.level))
  const method = character.hpCalculationMethod ?? 'fixed'
  const lines: HpLevelLine[] = []

  const first = gainForLevel(hitDie, conMod, true)
  lines.push({
    level: 1,
    base: first.base,
    conMod,
    total: first.total,
    label: first.label,
  })

  let total = first.total
  for (let lvl = 2; lvl <= level; lvl += 1) {
    const rolled = method === 'rolled' ? character.hpRolls?.[String(lvl)] : undefined
    const step = gainForLevel(hitDie, conMod, false, rolled)
    lines.push({
      level: lvl,
      base: step.base,
      conMod,
      total: step.total,
      label: step.label,
    })
    total += step.total
  }

  const explainLines = [
    `${className} использует кость хитов d${hitDie}.`,
    method === 'fixed'
      ? `На 1 уровне: ${hitDie} + телосложение. На следующих уровнях: ${averageHitDie(hitDie)} + телосложение.`
      : method === 'rolled'
        ? `На 1 уровне: ${hitDie} + телосложение. На следующих уровнях: результат броска d${hitDie} + телосложение.`
        : `На 1 уровне: ${hitDie} + телосложение. Дальше по выбранному режиму.`,
    `Телосложение ${con}, модификатор ${formatModifier(conMod)}.`,
    ...lines.map((line) => `${line.level} уровень: ${line.label}`),
    `Итого: ${lines.map((line) => line.total).join(' + ')} = ${total} HP`,
  ]
  if (conMod < 0) {
    explainLines.push('За уровень всегда добавляется хотя бы 1 хит.')
  }

  return {
    value: total,
    hitDie,
    method,
    usingOverride: false,
    rulesValue: total,
    lines,
    breakdown: {
      title: 'Максимум хитов',
      result: String(total),
      lines: explainLines,
    },
  }
}

export function effectiveMaxHp(character: Character): number {
  if (character.hpCalculationMethod === 'manual' && character.overrides.maxHp != null) {
    return character.overrides.maxHp
  }
  if (character.overrides.maxHp != null) {
    return character.overrides.maxHp
  }
  return calculateRulesMaxHp(character).value
}

export function explainEffectiveMaxHp(character: Character): CalculationBreakdown {
  const rules = calculateRulesMaxHp(character)
  const override = character.overrides.maxHp
  if (override == null && character.hpCalculationMethod !== 'manual') {
    return rules.breakdown
  }
  if (override == null) return rules.breakdown
  return {
    title: 'Максимум хитов',
    result: String(override),
    lines: [
      ...rules.breakdown.lines,
      `Используется ручное значение: ${override}.`,
      `Автоматический расчет: ${rules.value}.`,
    ],
  }
}

export function getHitDice(character: Character): { count: number; die: number; label: string } {
  const die = getClassHitDie(character.classId)
  const count = Math.min(20, Math.max(1, character.level))
  return { count, die, label: `${count}d${die}` }
}

export function explainHitDice(character: Character): CalculationBreakdown {
  const { count, die, label } = getHitDice(character)
  const className = getClassDefinition(character.classId)?.name ?? 'класс'
  return {
    title: 'Кости хитов',
    result: label,
    lines: [
      `${className}: кость хитов d${die}.`,
      `Число костей равно уровню класса: ${count}.`,
      `Итог: ${label}.`,
    ],
  }
}
