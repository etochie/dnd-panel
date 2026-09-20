import type { AbilityKey } from '../types/character'

export interface SkillDef {
  id: string
  name: string
  ability: AbilityKey
}

/** Навыки D&D 5e 2014 */
export const SKILLS_2014: SkillDef[] = [
  { id: 'acrobatics', name: 'Акробатика', ability: 'dex' },
  { id: 'animal_handling', name: 'Уход за животными', ability: 'wis' },
  { id: 'arcana', name: 'Магия', ability: 'int' },
  { id: 'athletics', name: '\u0410\u0442\u043b\u0435\u0442\u0438\u043a\u0430', ability: 'str' },
  { id: 'deception', name: 'Обман', ability: 'cha' },
  { id: 'history', name: 'История', ability: 'int' },
  { id: 'insight', name: '\u041f\u0440\u043e\u043d\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c', ability: 'wis' },
  { id: 'intimidation', name: 'Запугивание', ability: 'cha' },
  { id: 'investigation', name: 'Анализ', ability: 'int' },
  { id: 'medicine', name: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0430', ability: 'wis' },
  { id: 'nature', name: 'Природа', ability: 'int' },
  { id: 'perception', name: 'Внимательность', ability: 'wis' },
  { id: 'performance', name: 'Выступление', ability: 'cha' },
  { id: 'persuasion', name: 'Убеждение', ability: 'cha' },
  { id: 'religion', name: '\u0420\u0435\u043b\u0438\u0433\u0438\u044f', ability: 'int' },
  { id: 'sleight_of_hand', name: 'Ловкость рук', ability: 'dex' },
  { id: 'stealth', name: 'Скрытность', ability: 'dex' },
  { id: 'survival', name: 'Выживание', ability: 'wis' },
]
