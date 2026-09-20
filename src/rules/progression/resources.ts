import type { Character, ResourceState } from '../../types/character'
import { getChannelDivinityUses } from '../classes'

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
