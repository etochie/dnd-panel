/** Предыстории D&D 5e 2014 (PHB): два фиксированных навыка */
export interface BackgroundDefinition {
  id: string
  name: string
  skillIds: [string, string]
}

export const BACKGROUNDS_2014: BackgroundDefinition[] = [
  { id: 'acolyte', name: 'Прислужник', skillIds: ['insight', 'religion'] },
  { id: 'charlatan', name: 'Шарлатан', skillIds: ['deception', 'sleight_of_hand'] },
  { id: 'criminal', name: 'Преступник', skillIds: ['deception', 'stealth'] },
  { id: 'entertainer', name: 'Артист', skillIds: ['acrobatics', 'performance'] },
  { id: 'folk_hero', name: 'Народный герой', skillIds: ['animal_handling', 'survival'] },
  { id: 'guild_artisan', name: 'Ремесленник гильдии', skillIds: ['insight', 'persuasion'] },
  { id: 'hermit', name: 'Отшельник', skillIds: ['medicine', 'religion'] },
  { id: 'noble', name: 'Благородный', skillIds: ['history', 'persuasion'] },
  { id: 'outlander', name: 'Чужеземец', skillIds: ['athletics', 'survival'] },
  { id: 'sage', name: 'Мудрец', skillIds: ['arcana', 'history'] },
  { id: 'sailor', name: 'Моряк', skillIds: ['athletics', 'perception'] },
  { id: 'soldier', name: 'Солдат', skillIds: ['athletics', 'intimidation'] },
  { id: 'urchin', name: 'Бродяга', skillIds: ['sleight_of_hand', 'stealth'] },
]

export function getBackgroundDefinition(backgroundId: string): BackgroundDefinition | undefined {
  if (!backgroundId) return undefined
  return BACKGROUNDS_2014.find((item) => item.id === backgroundId)
}

export function backgroundSkillIds(backgroundId: string): string[] {
  const def = getBackgroundDefinition(backgroundId)
  return def ? [...def.skillIds] : []
}
