import type {
  AbilityKey,
  Character,
  ExtraProficiencies,
  InventoryItem,
  ItemCategory,
  ManualOverrides,
} from '../types/character'
import { ABILITY_KEYS, EMPTY_ABILITIES } from '../rules/core/types'
import { getClassSaveProficiencies, getGrantedProficiencies } from '../rules/classes'
import { normalizeInventory } from '../rules/combat/equipment'
import { ancestryIdFromLegacy, getRacialAbilityBonuses, raceIdFromLegacyName } from '../rules/races'

const ITEM_CATEGORIES: ItemCategory[] = [
  'weapon',
  'armor',
  'shield',
  'consumable',
  'magic',
  'tool',
  'other',
]

function migrateInventoryItem(raw: unknown): InventoryItem {
  const data = asRecord(raw)
  const categoryRaw = stringOr(data.category, 'other')
  const category = ITEM_CATEGORIES.includes(categoryRaw as ItemCategory)
    ? (categoryRaw as ItemCategory)
    : 'other'
  const armorTypeRaw = stringOr(data.armorType, '')
  const armorType =
    armorTypeRaw === 'light' || armorTypeRaw === 'medium' || armorTypeRaw === 'heavy'
      ? armorTypeRaw
      : undefined
  const equipmentSlot =
    data.equipmentSlot === ''
      ? ''
      : typeof data.equipmentSlot === 'string'
        ? data.equipmentSlot
        : undefined
  return {
    id: stringOr(data.id, ''),
    name: stringOr(data.name, 'Предмет'),
    quantity: Math.max(1, Math.floor(numberOr(data.quantity, 1))),
    weight: numberOr(data.weight, 0),
    cost: stringOr(data.cost, ''),
    description: stringOr(data.description, ''),
    equipped: data.equipped === true,
    category,
    equipmentSlot,
    equippedSlots: stringArray(data.equippedSlots),
    weaponDamage: typeof data.weaponDamage === 'string' ? data.weaponDamage : undefined,
    weaponDamageType: typeof data.weaponDamageType === 'string' ? data.weaponDamageType : undefined,
    weaponProperties: stringArray(data.weaponProperties),
    armorBaseAc: typeof data.armorBaseAc === 'number' ? data.armorBaseAc : undefined,
    armorMaxDex:
      data.armorMaxDex === null
        ? null
        : typeof data.armorMaxDex === 'number'
          ? data.armorMaxDex
          : undefined,
    armorType,
    strengthRequirement:
      typeof data.strengthRequirement === 'number' ? data.strengthRequirement : undefined,
    shieldBonus: typeof data.shieldBonus === 'number' ? data.shieldBonus : undefined,
    acBonus: typeof data.acBonus === 'number' ? data.acBonus : undefined,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function emptyJournal() {
  return { npcs: [], facts: '', quests: [], locations: [], generalNotes: '' }
}

function emptyProficiencies(): ExtraProficiencies {
  return { armor: [], weapons: [], tools: [], languages: [], other: [] }
}

export function migrateCharacter(raw: unknown): Character {
  const data = asRecord(raw)
  const now = new Date().toISOString()
  const level = Math.min(20, Math.max(1, numberOr(data.level, 1)))
  const classId = stringOr(data.classId, 'cleric')
  const raceId =
    stringOr(data.raceId, '') || raceIdFromLegacyName(stringOr(data.race, '')) || 'dragonborn'
  const raceDetails = asRecord(data.raceDetails)
  const ancestryId =
    stringOr(data.ancestryId, '') ||
    ancestryIdFromLegacy(
      stringOr(raceDetails.dragonbornLineage, ''),
      stringOr(raceDetails.breathType, ''),
    ) ||
    undefined

  const oldAbilities = asRecord(data.abilities)
  const oldBase = asRecord(data.baseAbilities)
  const racial = getRacialAbilityBonuses(raceId)
  const hasNewBase = ABILITY_KEYS.some((key) => typeof oldBase[key] === 'number')
  const baseAbilities = { ...EMPTY_ABILITIES }
  for (const key of ABILITY_KEYS) {
    if (hasNewBase && typeof oldBase[key] === 'number') {
      baseAbilities[key] = oldBase[key] as number
    } else if (typeof oldAbilities[key] === 'number') {
      baseAbilities[key] = (oldAbilities[key] as number) - (racial[key] ?? 0)
    }
  }

  const oldOverrides = asRecord(data.overrides)
  const overrides: ManualOverrides = {
    maxHp:
      typeof oldOverrides.maxHp === 'number'
        ? oldOverrides.maxHp
        : typeof data.maxHpOverride === 'number'
          ? data.maxHpOverride
          : undefined,
    speed:
      typeof oldOverrides.speed === 'number'
        ? oldOverrides.speed
        : typeof data.speedOverride === 'number'
          ? data.speedOverride
          : undefined,
    proficiencyBonus:
      typeof oldOverrides.proficiencyBonus === 'number' ? oldOverrides.proficiencyBonus : undefined,
    spellSaveDc: typeof oldOverrides.spellSaveDc === 'number' ? oldOverrides.spellSaveDc : undefined,
    spellAttackBonus:
      typeof oldOverrides.spellAttackBonus === 'number' ? oldOverrides.spellAttackBonus : undefined,
  }

  const granted = getGrantedProficiencies(classId, stringOr(data.subclassId, '') || undefined)
  const classSaves = getClassSaveProficiencies(classId)
  const oldProf = asRecord(data.extraProficiencies ?? data.proficiencies)
  const extraProficiencies: ExtraProficiencies = {
    armor: stringArray(oldProf.armor).filter((item) => !granted.armor.includes(item)),
    weapons: stringArray(oldProf.weapons).filter((item) => !granted.weapons.includes(item)),
    tools: stringArray(oldProf.tools),
    languages: stringArray(oldProf.languages).filter((item) => item !== 'common' && item !== 'draconic'),
    other: stringArray(oldProf.other),
  }

  const oldSaves = Array.isArray(data.saveProficiencies)
    ? (data.saveProficiencies as AbilityKey[])
    : []
  const extraSaves = Array.isArray(data.extraSaveProficiencies)
    ? (data.extraSaveProficiencies as AbilityKey[])
    : oldSaves.filter((key) => !classSaves.includes(key))

  const hpRolls =
    data.hpRolls && typeof data.hpRolls === 'object' ? (data.hpRolls as Record<string, number>) : {}

  return {
    id: stringOr(data.id, ''),
    name: stringOr(data.name, 'Без имени'),
    raceId,
    ancestryId,
    classId,
    subclassId: stringOr(data.subclassId, '') || undefined,
    level,
    background: stringOr(data.background, ''),
    alignment: stringOr(data.alignment, ''),
    notes: stringOr(data.notes, ''),
    abilityGenerationMethod:
      data.abilityGenerationMethod === 'standard_array' ||
      data.abilityGenerationMethod === 'point_buy' ||
      data.abilityGenerationMethod === 'manual'
        ? data.abilityGenerationMethod
        : 'manual',
    baseAbilities,
    asiChoices: Array.isArray(data.asiChoices) ? data.asiChoices : [],
    allowFeats: data.allowFeats !== false,
    hpCalculationMethod:
      data.hpCalculationMethod === 'rolled' ||
      data.hpCalculationMethod === 'manual' ||
      data.hpCalculationMethod === 'fixed'
        ? data.hpCalculationMethod
        : overrides.maxHp != null
          ? 'manual'
          : 'fixed',
    hpRolls,
    skillProficiencies: stringArray(data.skillProficiencies),
    skillExpertise: stringArray(data.skillExpertise),
    extraSaveProficiencies: extraSaves,
    extraProficiencies,
    knownSpellIds: stringArray(data.knownSpellIds),
    preparedSpellIds: stringArray(data.preparedSpellIds),
    cantripIds: stringArray(data.cantripIds),
    spellSlots: Array.isArray(data.spellSlots) ? data.spellSlots : [],
    currentHp: numberOr(data.currentHp, 1),
    tempHp: numberOr(data.tempHp, 0),
    hitDiceRemaining: numberOr(data.hitDiceRemaining, level),
    resources: Array.isArray(data.resources) ? data.resources : [],
    inventory: normalizeInventory(
      Array.isArray(data.inventory) ? data.inventory.map((item) => migrateInventoryItem(item)) : [],
    ),
    conditions: stringArray(data.conditions),
    journal: data.journal && typeof data.journal === 'object' ? (data.journal as Character['journal']) : emptyJournal(),
    money:
      data.money && typeof data.money === 'object'
        ? (data.money as Character['money'])
        : { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    combat:
      data.combat && typeof data.combat === 'object'
        ? (data.combat as Character['combat'])
        : {
            actionUsed: false,
            bonusActionUsed: false,
            reactionUsed: false,
            movementRemaining: 9,
          },
    concentration:
      data.concentration && typeof data.concentration === 'object'
        ? (data.concentration as Character['concentration'])
        : null,
    overrides,
    createdAt: stringOr(data.createdAt, now),
    updatedAt: stringOr(data.updatedAt, now),
  }
}

export { emptyJournal, emptyProficiencies }
