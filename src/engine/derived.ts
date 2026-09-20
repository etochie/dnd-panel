import type { Character } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { calculateAbilityModifier, explainAbilityModifier } from './abilities'
import {
  calculateArmorClass,
  calculateInitiative,
  calculatePassivePerception,
  calculateSpellAttackBonus,
  calculateSpellSaveDC,
} from './armorClass'
import { calculateAttacks } from './attacks'
import { explainProficiencyBonus, calculateProficiencyBonus } from './proficiency'
import { calculateAllSavingThrows } from './saves'
import { calculateAllSkills, calculateSkillBonus } from './skills'
import { getClassDefinition } from '../data/classes'
import { preparedSpellLimitForCharacter } from './spellPreparation'

export interface DerivedStats {
  abilityModifiers: Record<string, number>
  proficiencyBonus: number
  proficiencyBreakdown: CalculationBreakdown
  ac: number
  acBreakdown: CalculationBreakdown
  initiative: number
  initiativeBreakdown: CalculationBreakdown
  speed: number
  maxHp: number
  spellcastingMod: number
  spellSaveDc: number
  spellSaveDcBreakdown: CalculationBreakdown
  spellAttackBonus: number
  spellAttackBreakdown: CalculationBreakdown
  passivePerception: number
  passivePerceptionBreakdown: CalculationBreakdown
  skills: ReturnType<typeof calculateAllSkills>
  saves: ReturnType<typeof calculateAllSavingThrows>
  attacks: ReturnType<typeof calculateAttacks>
  abilityBreakdowns: Record<string, CalculationBreakdown>
  preparedSpellLimit: number
  preparedSpellLimitBreakdown: CalculationBreakdown
  cantripsKnownLimit: number
  maxSpellSlotLevel: number
}

export function deriveCharacterStats(character: Character): DerivedStats {
  const classDef = getClassDefinition(character.classId)
  const spellAbility = classDef?.spellcastingAbility ?? 'wis'
  const spellcastingMod = calculateAbilityModifier(character.abilities[spellAbility])

  const { ac, breakdown: acBreakdown } = calculateArmorClass(character)
  const { value: initiative, breakdown: initiativeBreakdown } =
    calculateInitiative(character)
  const proficiencyBonus = calculateProficiencyBonus(character.level)
  const proficiencyBreakdown = explainProficiencyBonus(character.level)

  const perception = calculateSkillBonus(character, 'perception')
  const passivePerceptionBreakdown = calculatePassivePerception(perception.bonus)

  const { dc: spellSaveDc, breakdown: spellSaveDcBreakdown } = calculateSpellSaveDC(
    character,
    spellcastingMod,
  )
  const { bonus: spellAttackBonus, breakdown: spellAttackBreakdown } =
    calculateSpellAttackBonus(character, spellcastingMod)

  const speed = character.speedOverride ?? 9
  const maxHp =
    character.maxHpOverride ??
    character.currentHp

  const abilityBreakdowns: Record<string, CalculationBreakdown> = {}
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    abilityBreakdowns[key] = explainAbilityModifier(key, character.abilities[key])
  }

  const prepared = preparedSpellLimitForCharacter(character)

  return {
    abilityModifiers: {
      str: calculateAbilityModifier(character.abilities.str),
      dex: calculateAbilityModifier(character.abilities.dex),
      con: calculateAbilityModifier(character.abilities.con),
      int: calculateAbilityModifier(character.abilities.int),
      wis: calculateAbilityModifier(character.abilities.wis),
      cha: calculateAbilityModifier(character.abilities.cha),
    },
    proficiencyBonus,
    proficiencyBreakdown,
    ac,
    acBreakdown,
    initiative,
    initiativeBreakdown,
    speed,
    maxHp,
    spellcastingMod,
    spellSaveDc,
    spellSaveDcBreakdown,
    spellAttackBonus,
    spellAttackBreakdown,
    passivePerception: 10 + perception.bonus,
    passivePerceptionBreakdown,
    skills: calculateAllSkills(character),
    saves: calculateAllSavingThrows(character),
    attacks: calculateAttacks(character),
    abilityBreakdowns,
    preparedSpellLimit: prepared.limit,
    preparedSpellLimitBreakdown: prepared.breakdown,
    cantripsKnownLimit: prepared.cantripsKnown,
    maxSpellSlotLevel: prepared.maxSlotLevel,
  }
}
