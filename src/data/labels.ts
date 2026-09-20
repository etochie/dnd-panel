import type { ItemCategory } from '../types/character'

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: 'оружие',
  armor: 'броня',
  shield: 'щит',
  consumable: 'расходуемые',
  magic: 'магические предметы',
  tool: 'инструменты',
  other: 'прочее',
}

export const PROFICIENCY_LABELS: Record<string, string> = {
  light: 'лёгкая',
  medium: 'средняя',
  heavy: 'тяжёлая',
  shield: 'щиты',
  simple: 'простое',
  martial: 'военное',
  common: 'общий',
  draconic: 'драконий',
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  action: 'действие',
  bonus: 'бонусное действие',
  reaction: 'реакция',
  movement: 'перемещение',
}

export const SAVE_LABELS: Record<string, string> = {
  STR: 'СИЛ',
  DEX: 'ЛОВ',
  CON: 'ТЕЛ',
  INT: 'ИНТ',
  WIS: 'МДР',
  CHA: 'ХАР',
}

export const RESOURCE_LABELS: Record<string, string> = {
  channel_divinity: 'Божественный канал',
  breath_weapon: 'Драконье дыхание',
}

export function labelList(values: string[], dictionary: Record<string, string>): string {
  if (values.length === 0) return 'нет'
  return values.map((value) => dictionary[value] ?? value).join(', ')
}
