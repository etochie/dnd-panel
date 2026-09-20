import type { Character } from '../types/character'
import { deriveCharacterStats, getSpellSlots } from '../rules'

export interface RestPreview {
  label: string
  changes: string[]
}

export function previewShortRest(character: Character): RestPreview {
  const derived = deriveCharacterStats(character)
  const changes: string[] = []
  for (const resource of derived.resources) {
    if (resource.recharge === 'short_rest' && resource.current < resource.max) {
      changes.push(`${resource.name}: восстановится до ${resource.max}`)
    }
  }
  changes.push('Кости хитов: можно потратить и восстановить хиты (по правилам 2014, вручную).')
  return { label: 'Короткий отдых', changes }
}

export function applyShortRest(character: Character): Character {
  const derived = deriveCharacterStats(character)
  const resources = derived.resources.map((resource) =>
    resource.recharge === 'short_rest' ? { ...resource, current: resource.max } : resource,
  )
  return { ...character, resources, updatedAt: new Date().toISOString() }
}

export function previewLongRest(character: Character): RestPreview {
  const derived = deriveCharacterStats(character)
  const changes: string[] = [
    'Хиты: восстанавливаются полностью.',
    'Все ячейки заклинаний восстанавливаются.',
  ]
  for (const resource of derived.resources) {
    if (resource.recharge === 'short_rest' || resource.recharge === 'long_rest') {
      if (resource.current < resource.max) changes.push(`${resource.name}: до ${resource.max}`)
    }
  }
  return { label: 'Продолжительный отдых', changes }
}

export function applyLongRest(character: Character): Character {
  const derived = deriveCharacterStats(character)
  const slots = getSpellSlots(character.classId, character.level).map((slot) => {
    const existing = character.spellSlots.find((item) => item.level === slot.level)
    return { ...slot, current: slot.max, max: existing?.max ?? slot.max }
  })
  const resources = derived.resources.map((resource) =>
    resource.recharge === 'short_rest' || resource.recharge === 'long_rest'
      ? { ...resource, current: resource.max }
      : resource,
  )
  return {
    ...character,
    currentHp: derived.maxHp,
    spellSlots: slots,
    resources,
    hitDiceRemaining: character.level,
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: derived.speed,
    },
    updatedAt: new Date().toISOString(),
  }
}
