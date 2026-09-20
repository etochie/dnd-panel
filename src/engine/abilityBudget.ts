import { getClassDefinition } from '../data/classes'
import { racialAbilityBonusesFor } from '../data/races'
import type { AbilityKey, Character } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { ABILITY_LABELS } from './abilities'

/** Стоимость покупки очков PHB 2014: значения от 8 до 15, всего 27 очков. */
export const POINT_BUY_LIMIT = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function pointBuyCost(score: number): number {
  if (score <= POINT_BUY_MIN) return 0
  if (score >= POINT_BUY_MAX) return POINT_BUY_COST[POINT_BUY_MAX]
  return POINT_BUY_COST[score] ?? 0
}

export interface AbilityBudget {
  className: string
  level: number
  pointBuyLimit: number
  pointBuySpent: number
  pointBuyRemaining: number
  asiLevels: number[]
  asiGained: number
  asiPointsAvailable: number
  asiPointsSpent: number
  asiRemaining: number
  racialLabel: string
  breakdown: CalculationBreakdown
}

export function calculateAbilityBudget(character: Character): AbilityBudget {
  const classDef = getClassDefinition(character.classId)
  const className = classDef?.name ?? 'класс'
  const asiLevels = classDef?.asiLevels ?? []
  const asiGained = asiLevels.filter((lvl) => character.level >= lvl).length
  const asiPointsAvailable = asiGained * 2
  const racial = racialAbilityBonusesFor(character.race)

  let pointBuySpent = 0
  let asiPointsSpent = 0
  const detailLines: string[] = []

  for (const key of ABILITY_KEYS) {
    const racialBonus = racial?.bonuses[key] ?? 0
    const preRacial = character.abilities[key] - racialBonus
    const buyCost = preRacial < POINT_BUY_MIN ? 0 : pointBuyCost(preRacial)
    const asiHere = Math.max(0, preRacial - POINT_BUY_MAX)
    pointBuySpent += buyCost
    asiPointsSpent += asiHere

    const parts = [`${ABILITY_LABELS[key]} ${character.abilities[key]}`]
    if (racialBonus) parts.push(`раса ${racialBonus > 0 ? '+' : ''}${racialBonus}`)
    if (preRacial < POINT_BUY_MIN) {
      parts.push(`ниже минимума покупки ${POINT_BUY_MIN}`)
    } else {
      parts.push(`покупка до ${Math.min(POINT_BUY_MAX, preRacial)} стоит ${buyCost}`)
    }
    if (asiHere > 0) parts.push(`улучшение +${asiHere}`)
    detailLines.push(parts.join(', '))
  }

  const nextAsi = asiLevels.find((lvl) => character.level < lvl)
  const lines = [
    `Покупка очков при создании: ${pointBuySpent} из ${POINT_BUY_LIMIT}. Осталось ${POINT_BUY_LIMIT - pointBuySpent}.`,
    `${className}: улучшение характеристик на уровнях ${asiLevels.join(', ')}.`,
    `На ${character.level} уровне получено улучшений: ${asiGained}. Это ${asiPointsAvailable} очков.`,
    `Потрачено очков улучшения: ${asiPointsSpent}. Осталось ${asiPointsAvailable - asiPointsSpent}.`,
    racial
      ? racial.label
      : character.race.trim()
        ? `Расовые бонусы для "${character.race}" в данных 2014 не заданы.`
        : 'Раса не выбрана, расовые бонусы не добавлены.',
    nextAsi
      ? `Следующее улучшение на ${nextAsi} уровне.`
      : 'Все улучшения характеристик этого класса уже получены.',
    ...detailLines,
  ]

  return {
    className,
    level: character.level,
    pointBuyLimit: POINT_BUY_LIMIT,
    pointBuySpent,
    pointBuyRemaining: POINT_BUY_LIMIT - pointBuySpent,
    asiLevels,
    asiGained,
    asiPointsAvailable,
    asiPointsSpent,
    asiRemaining: asiPointsAvailable - asiPointsSpent,
    racialLabel: racial?.label ?? '',
    breakdown: {
      title: 'Очки характеристик',
      result: `Покупка ${pointBuySpent}/${POINT_BUY_LIMIT}, улучшение ${asiPointsSpent}/${asiPointsAvailable}`,
      lines,
    },
  }
}
