import { STANDARD_ACTIONS_2014, type CombatActionDef } from '../../data/combatActions'
import type { Character } from '../../types/character'
import { getClassFeatures, getSubclassFeatures } from '../classes'
import { getRacialFeatures } from '../races'
import { getDragonbornBreath } from '../races'
import { getProficiencyBonus } from '../core/proficiency'
import { resolveAbilityScores } from '../generation/resolveAbilities'

export function getAvailableActions(character: Character): CombatActionDef[] {
  const actions = [...STANDARD_ACTIONS_2014.filter((item) => item.actionType === 'action')]
  const breath = getDragonbornBreath(
    character.level,
    character.ancestryId,
    resolveAbilityScores(character).scores.con,
    getProficiencyBonus(character.level),
  )
  if (character.raceId === 'dragonborn' && breath) {
    actions.push({
      id: 'breath_weapon',
      name: 'Драконье дыхание',
      actionType: 'action',
      summary: `${breath.damage}, ${breath.area}, спасбросок ${breath.save} Сл ${breath.saveDc}.`,
      spends: 'Действие и одно использование оружия дыхания.',
      after: 'Действие использовано. Дыхание восстанавливается после короткого или продолжительного отдыха.',
    })
  }
  if (character.level >= 2 && character.classId === 'cleric') {
    actions.push({
      id: 'turn_undead',
      name: 'Изгнание нежити',
      actionType: 'action',
      summary: 'Божественный канал: изгнать нежить в пределах 9 м.',
      spends: 'Действие и одно использование Божественного канала.',
      after: 'Действие и ресурс использованы.',
    })
  }
  return actions
}

export function getAvailableBonusActions(character: Character): CombatActionDef[] {
  const items: CombatActionDef[] = []
  const prepared = [...character.preparedSpellIds, ...character.cantripIds]
  if (prepared.includes('spiritual_weapon')) {
    items.push({
      id: 'spiritual_weapon',
      name: 'Духовное оружие',
      actionType: 'bonus',
      summary: 'Создать или переместить духовное оружие и атаковать им.',
      spends: 'Бонусное действие. При первом наложении нужна ячейка 2 круга.',
      after: 'Бонусное действие использовано.',
    })
  }
  if (items.length === 0 && character.classId === 'cleric') {
    items.push({
      id: 'no_bonus',
      name: 'Нет постоянных бонусных действий',
      actionType: 'bonus',
      summary: 'У жреца 3 уровня нет классового бонусного действия без заклинания или способности.',
      spends: 'Ничего.',
      after: 'Если появится подходящее заклинание, оно будет показано здесь.',
    })
  }
  return items
}

export function getAvailableReactions(_character: Character): CombatActionDef[] {
  return [
    {
      id: 'opportunity_attack',
      name: 'Атака возможности',
      actionType: 'reaction',
      summary: 'Рукопашная атака, когда видимый враг покидает вашу досягаемость.',
      spends: 'Реакция.',
      after: 'Реакция использована до начала вашего следующего хода.',
    },
  ]
}

export function getCharacterFeatures(character: Character) {
  return {
    classFeatures: getClassFeatures(character.classId, character.level),
    subclassFeatures: getSubclassFeatures(character.subclassId, character.level),
    racialFeatures: getRacialFeatures(character.raceId, character.level),
  }
}
