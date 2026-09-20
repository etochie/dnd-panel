import type { AsiChoice } from '../core/types'
import type { Character } from '../../types/character'
import { getProficiencyBonus } from '../core/proficiency'
import { getCantripsKnown, getChannelDivinityUses, getClassDefinition, classGainsAsiAtLevel } from '../classes'
import { getSpellSlots } from '../spells/slots'
import { calculateRulesMaxHp, getHitDice } from './hitPoints'

export interface LevelUpChange {
  label: string
  detail: string
}

export interface LevelUpPreview {
  fromLevel: number
  toLevel: number
  needsAsi: boolean
  needsHpRoll: boolean
  hitDie: number
  changes: LevelUpChange[]
}

export function previewLevelUp(character: Character): LevelUpPreview | null {
  if (character.level >= 20) return null
  const fromLevel = character.level
  const toLevel = fromLevel + 1
  const classDef = getClassDefinition(character.classId)
  const className = classDef?.name ?? 'класс'
  const next = { ...character, level: toLevel }
  const profBefore = getProficiencyBonus(fromLevel)
  const profAfter = getProficiencyBonus(toLevel)
  const slotsBefore = getSpellSlots(character.classId, fromLevel)
  const slotsAfter = getSpellSlots(character.classId, toLevel)
  const hpBefore = calculateRulesMaxHp(character).value
  const hpAfter = calculateRulesMaxHp(next).value
  const diceBefore = getHitDice(character).label
  const diceAfter = getHitDice(next).label
  const needsAsi = classGainsAsiAtLevel(character.classId, toLevel)
  const needsHpRoll = character.hpCalculationMethod === 'rolled'
  const cantripsBefore = getCantripsKnown(character.classId, fromLevel)
  const cantripsAfter = getCantripsKnown(character.classId, toLevel)
  const channelBefore = getChannelDivinityUses(character.classId, fromLevel)
  const channelAfter = getChannelDivinityUses(character.classId, toLevel)
  const row = classDef?.progression[toLevel]
  const newFeatures = row?.features.filter((name) => name !== 'Улучшение характеристик') ?? []

  const changes: LevelUpChange[] = [
    { label: 'Уровень', detail: `${fromLevel} → ${toLevel}` },
    {
      label: 'Бонус мастерства',
      detail: profBefore === profAfter ? `остается +${profBefore}` : `+${profBefore} → +${profAfter}`,
    },
    {
      label: 'Ячейки заклинаний',
      detail: describeSlotChange(slotsBefore, slotsAfter),
    },
    { label: 'Кости хитов', detail: `${diceBefore} → ${diceAfter}` },
    {
      label: 'Максимум хитов',
      detail:
        character.overrides.maxHp != null
          ? `стоит ручное значение ${character.overrides.maxHp}. По правилам было бы ${hpBefore} → ${hpAfter}`
          : `${hpBefore} → ${hpAfter}`,
    },
  ]
  if (cantripsBefore !== cantripsAfter) {
    changes.push({ label: 'Заговоры', detail: `${cantripsBefore} → ${cantripsAfter}` })
  }
  if (channelBefore !== channelAfter) {
    changes.push({ label: 'Божественный канал', detail: `${channelBefore} → ${channelAfter}` })
  }
  if (needsAsi) {
    changes.push({
      label: 'Улучшение характеристик',
      detail: `появляется на ${toLevel} уровне ${className}`,
    })
  } else {
    changes.push({
      label: 'Улучшение характеристик',
      detail: `на ${toLevel} уровне нет`,
    })
  }
  for (const name of newFeatures) {
    changes.push({ label: 'Новая способность', detail: name })
  }

  return { fromLevel, toLevel, needsAsi, needsHpRoll, hitDie: classDef?.hitDie ?? 8, changes }
}

function describeSlotChange(
  before: { level: number; max: number }[],
  after: { level: number; max: number }[],
): string {
  const parts: string[] = []
  for (const slot of after) {
    const old = before.find((item) => item.level === slot.level)?.max ?? 0
    if (old !== slot.max) {
      parts.push(`${slot.level} круг: ${old} → ${slot.max}`)
    }
  }
  return parts.length > 0 ? parts.join(', ') : 'без изменений'
}

export function applyLevelUp(
  character: Character,
  options: { asiChoice?: AsiChoice; hpRoll?: number },
): Character {
  const preview = previewLevelUp(character)
  if (!preview) return character
  const level = preview.toLevel
  const hpRolls = { ...(character.hpRolls ?? {}) }
  if (preview.needsHpRoll && options.hpRoll != null) {
    hpRolls[String(level)] = options.hpRoll
  }
  const asiChoices = [...(character.asiChoices ?? [])]
  if (preview.needsAsi && options.asiChoice) {
    asiChoices.push({ ...options.asiChoice, level })
  }
  return {
    ...character,
    level,
    hpRolls,
    asiChoices,
    hitDiceRemaining: Math.min(level, character.hitDiceRemaining + 1),
    updatedAt: new Date().toISOString(),
  }
}
