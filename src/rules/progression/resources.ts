import type { Character, ResourceState } from '../../types/character'
import { getChannelDivinityUses } from '../classes'
import { HARNESS_RESOURCE_ID, harnessUses } from '../classes/harnessDivinePower'

export function getRulesResources(character: Character): ResourceState[] {
  const resources: ResourceState[] = []
  const channelMax = getChannelDivinityUses(character.classId, character.level)
  if (channelMax > 0) {
    const existing = character.resources.find((item) => item.id === 'channel_divinity')
    resources.push({
      id: 'channel_divinity',
      name: 'Божественный канал',
      current: existing ? Math.min(existing.current, channelMax) : channelMax,
      max: channelMax,
      recharge: 'short_rest',
      description: 'На 2 уровне - 1 использование, на 6 - 2, на 18 - 3 (2014).',
    })
  }
  const harnessMax = harnessUses(character.level)
  if (character.classId === 'cleric' && harnessMax > 0) {
    const existing = character.resources.find((item) => item.id === HARNESS_RESOURCE_ID)
    resources.push({
      id: HARNESS_RESOURCE_ID,
      name: 'Праведное восстановление',
      current: existing ? Math.min(existing.current, harnessMax) : harnessMax,
      max: harnessMax,
      recharge: 'long_rest',
      description:
        'Опциональное умение жреца (TCE). Бонусное действие и одно использование Божественного канала: вернуть ячейку не выше половины бонуса мастерства. 1 использование на 2 уровне, 2 на 6, 3 на 18.',
    })
  }
  if (character.raceId === 'dragonborn') {
    const existing = character.resources.find((item) => item.id === 'breath_weapon')
    resources.push({
      id: 'breath_weapon',
      name: 'Драконье дыхание',
      current: existing ? Math.min(existing.current, 1) : 1,
      max: 1,
      recharge: 'short_rest',
      description: 'Оружие дыхания драконорожденного, короткий или продолжительный отдых.',
    })
  }
  const knownIds = new Set(resources.map((item) => item.id))
  for (const extra of character.resources) {
    if (!knownIds.has(extra.id)) resources.push(extra)
  }
  return resources
}

export function withSyncedResources(character: Character): Character {
  return { ...character, resources: getRulesResources(character) }
}
