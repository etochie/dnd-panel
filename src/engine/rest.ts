import type { Character } from '../types/character'
import { buildSpellSlotsForCleric } from '../data/classes'
import { effectiveMaxHp } from './hitPoints'

export interface RestPreview {
  label: string
  changes: string[]
}

export function previewShortRest(character: Character): RestPreview {
  const changes: string[] = []
  for (const r of character.resources) {
    if (r.recharge === 'short_rest' && r.current < r.max) {
      changes.push(`${r.name}: восстановится до ${r.max}`)
    }
  }
  changes.push('Кости хитов: можно потратить и восстановить хиты (по правилам 2014, вручную).')
  return { label: 'Короткий отдых', changes }
}

export function applyShortRest(character: Character): Character {
  const resources = character.resources.map((r) =>
    r.recharge === 'short_rest' ? { ...r, current: r.max } : r,
  )
  return { ...character, resources, updatedAt: new Date().toISOString() }
}

export function previewLongRest(character: Character): RestPreview {
  const changes: string[] = [
    'Хиты: восстановление по правилам (для жреца - все хиты, если не указано иное).',
    'Все ячейки заклинаний восстанавливаются.',
  ]
  for (const r of character.resources) {
    if (r.recharge === 'short_rest' || r.recharge === 'long_rest') {
      if (r.current < r.max) changes.push(`${r.name}: до ${r.max}`)
    }
  }
  return { label: 'Продолжительный отдых', changes }
}

export function applyLongRest(character: Character): Character {
  const maxHp = effectiveMaxHp(character)
  const slots =
    character.classId === 'cleric'
      ? buildSpellSlotsForCleric(character.level).map((s) => {
          const existing = character.spellSlots.find((x) => x.level === s.level)
          return { ...s, current: s.max, max: existing?.max ?? s.max }
        })
      : character.spellSlots.map((s) => ({ ...s, current: s.max }))

  const resources = character.resources.map((r) =>
    r.recharge === 'short_rest' || r.recharge === 'long_rest'
      ? { ...r, current: r.max }
      : r,
  )

  return {
    ...character,
    currentHp: maxHp,
    spellSlots: slots,
    resources,
    hitDiceRemaining: character.level,
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: character.speedOverride ?? 9,
    },
    updatedAt: new Date().toISOString(),
  }
}
