import type { Character } from '../../types/character'
import { earnedAsiLevels, getClassDefinition, getClassSpellSlots } from '../classes'
import { POINT_BUY_LIMIT, POINT_BUY_MAX, POINT_BUY_MIN, pointBuySpent } from '../generation/pointBuy'
import { isStandardArrayAssignment } from '../generation/standardArray'
import { resolveAbilityScores } from '../generation/resolveAbilities'
import { ABILITY_KEYS } from '../core/types'
import { calculateRulesMaxHp } from '../progression/hitPoints'
import { getPendingAsiLevels } from '../progression/asi'
import { preparedSpellLimitForCharacter } from '../spells/preparation'
import { ABILITY_LABELS } from '../core/abilities'

export type ValidationSeverity = 'error' | 'info'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  message: string
}

export function validateCharacter(character: Character): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const classDef = getClassDefinition(character.classId)
  const className = classDef?.name ?? character.classId
  const earnedAsi = earnedAsiLevels(character.classId, character.level)
  const pending = getPendingAsiLevels(character)
  const scores = resolveAbilityScores(character)

  if (earnedAsi.length === 0) {
    issues.push({
      id: 'asi-none',
      severity: 'info',
      message: `${className} ${character.level} уровня не получает улучшение характеристик.`,
    })
  }
  const invalidAsi = (character.asiChoices ?? []).filter(
    (choice) => !earnedAsi.includes(choice.level),
  )
  for (const choice of invalidAsi) {
    issues.push({
      id: `asi-invalid-${choice.level}`,
      severity: 'error',
      message: `${className} не получает улучшение характеристик на ${choice.level} уровне.`,
    })
  }
  if (pending.length > 0) {
    issues.push({
      id: 'asi-pending',
      severity: 'error',
      message: `Нужно выбрать улучшение характеристик для уровней: ${pending.join(', ')}.`,
    })
  }

  const slotRow = getClassSpellSlots(character.classId, character.level)
  slotRow.forEach((max, index) => {
    const stored = character.spellSlots.find((slot) => slot.level === index + 1)
    if (max === 0 && stored && stored.max > 0) {
      issues.push({
        id: `slot-too-high-${index + 1}`,
        severity: 'error',
        message: `У персонажа ${character.level} уровня не должно быть ячеек ${index + 1} уровня.`,
      })
    }
  })

  const rulesHp = calculateRulesMaxHp(character)
  if (character.overrides.maxHp != null || character.hpCalculationMethod === 'manual') {
    issues.push({
      id: 'hp-manual',
      severity: 'info',
      message: `Используется ручное значение максимума хитов ${character.overrides.maxHp ?? 'не задано'}. Автоматический расчет: ${rulesHp.value}.`,
    })
  } else {
    issues.push({
      id: 'hp-rules',
      severity: 'info',
      message: `При ${ABILITY_LABELS.con} ${scores.scores.con} и ${className} ${character.level} стандартный фиксированный максимум хитов = ${rulesHp.value}.`,
    })
  }

  if (character.abilityGenerationMethod === 'point_buy') {
    const spent = pointBuySpent(ABILITY_KEYS.map((key) => character.baseAbilities[key]))
    const outOfRange = ABILITY_KEYS.filter((key) => {
      const value = character.baseAbilities[key]
      return value < POINT_BUY_MIN || value > POINT_BUY_MAX
    })
    if (spent > POINT_BUY_LIMIT) {
      issues.push({
        id: 'point-buy-over',
        severity: 'error',
        message: `Покупка очков: потрачено ${spent} из ${POINT_BUY_LIMIT}.`,
      })
    } else {
      issues.push({
        id: 'point-buy-ok',
        severity: 'info',
        message: `Покупка очков: потрачено ${spent} из ${POINT_BUY_LIMIT}. Осталось ${POINT_BUY_LIMIT - spent}.`,
      })
    }
    for (const key of outOfRange) {
      issues.push({
        id: `point-buy-range-${key}`,
        severity: 'error',
        message: `Покупка очков не позволяет поставить ${ABILITY_LABELS[key]} ниже ${POINT_BUY_MIN} или выше ${POINT_BUY_MAX} до расовых бонусов.`,
      })
    }
  }

  if (character.abilityGenerationMethod === 'standard_array') {
    const bases = ABILITY_KEYS.map((key) => character.baseAbilities[key])
    if (!isStandardArrayAssignment(bases)) {
      issues.push({
        id: 'standard-array',
        severity: 'error',
        message: 'Стандартный набор должен использовать значения 15, 14, 13, 12, 10 и 8 без повторов.',
      })
    }
  }

  const prep = preparedSpellLimitForCharacter(character)
  if (character.preparedSpellIds.length > prep.limit) {
    issues.push({
      id: 'prepared-over',
      severity: 'error',
      message: `Подготовлено ${character.preparedSpellIds.length} заклинаний из ${prep.limit}.`,
    })
  }
  if (character.cantripIds.length > prep.cantripsKnown) {
    issues.push({
      id: 'cantrips-over',
      severity: 'error',
      message: `Известно ${character.cantripIds.length} заговоров из ${prep.cantripsKnown}.`,
    })
  }

  if (character.overrides.speed != null) {
    issues.push({
      id: 'speed-manual',
      severity: 'info',
      message: 'Используется ручное значение скорости.',
    })
  }
  if (character.overrides.proficiencyBonus != null) {
    issues.push({
      id: 'prof-manual',
      severity: 'info',
      message: 'Используется ручное значение бонуса мастерства.',
    })
  }

  return issues
}
