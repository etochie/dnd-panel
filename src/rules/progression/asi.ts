import type { AbilityKey, Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { classGainsAsiAtLevel, earnedAsiLevels, getClassDefinition } from '../classes'
import { ABILITY_LABELS } from '../core/abilities'
import type { AsiChoice } from '../core/types'

export function hasAsiAtLevel(classId: string, level: number): boolean {
  return classGainsAsiAtLevel(classId, level)
}

export function getPendingAsiLevels(character: Character): number[] {
  const earned = earnedAsiLevels(character.classId, character.level)
  const taken = new Set((character.asiChoices ?? []).map((choice) => choice.level))
  return earned.filter((level) => !taken.has(level))
}

export function describeAsiChoice(choice: AsiChoice): string {
  if (choice.kind === 'feat') {
    return `Уровень ${choice.level}: черта "${choice.featName}"`
  }
  const parts = Object.entries(choice.increases)
    .filter(([, value]) => value)
    .map(([key, value]) => `${ABILITY_LABELS[key as AbilityKey]} ${value! > 0 ? '+' : ''}${value}`)
  return `Уровень ${choice.level}: ${parts.join(', ') || 'без изменений'}`
}

export function explainAsiStatus(character: Character): CalculationBreakdown {
  const classDef = getClassDefinition(character.classId)
  const levels = classDef?.asiLevels ?? []
  const earned = earnedAsiLevels(character.classId, character.level)
  const pending = getPendingAsiLevels(character)
  const lines = [
    `${classDef?.name ?? 'Класс'}: улучшение характеристик на уровнях ${levels.join(', ') || 'нет данных'}.`,
    earned.length === 0
      ? `На ${character.level} уровне улучшение характеристик не предоставляется.`
      : `Получено улучшений: ${earned.join(', ')}.`,
  ]
  if (character.asiChoices?.length) {
    lines.push(...character.asiChoices.map(describeAsiChoice))
  }
  if (pending.length > 0) {
    lines.push(`Нужно сделать выбор для уровней: ${pending.join(', ')}.`)
  }
  return {
    title: 'Улучшение характеристик',
    result: earned.length === 0 ? 'Нет' : pending.length > 0 ? 'Нужен выбор' : 'Получено',
    lines,
  }
}

export function createPlusTwoChoice(level: number, ability: AbilityKey): AsiChoice {
  return { level, kind: 'scores', increases: { [ability]: 2 } }
}

export function createPlusOnePlusOneChoice(
  level: number,
  first: AbilityKey,
  second: AbilityKey,
): AsiChoice {
  if (first === second) {
    return createPlusTwoChoice(level, first)
  }
  return { level, kind: 'scores', increases: { [first]: 1, [second]: 1 } }
}

export function createFeatChoice(level: number, featId: string, featName: string): AsiChoice {
  return { level, kind: 'feat', featId, featName }
}
