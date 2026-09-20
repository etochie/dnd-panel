import type { Character, SpellSlotState } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { calculateAbilityModifier } from './core/abilities'
import { explainProficiencyBonus, getProficiencyBonus } from './core/proficiency'
import {
  getClassDefinition,
  getDomainSpellIds,
  getGrantedProficiencies,
  getSubclassDefinition,
} from './classes'
import { getEffectiveSaveProficiencies } from './combat/saves'
import {
  calculateArmorClass,
  calculateInitiative,
  calculatePassivePerception,
} from './combat/armorClass'
import { calculateAttacks } from './combat/attacks'
import { calculateAllSavingThrows } from './combat/saves'
import { calculateAllSkills, calculateSkillBonus } from './combat/skills'
import {
  getAvailableActions,
  getAvailableBonusActions,
  getAvailableReactions,
  getCharacterFeatures,
} from './combat/actions'
import { explainAbilityTotal, resolveAbilityScores } from './generation/resolveAbilities'
import {
  calculateRulesMaxHp,
  effectiveMaxHp,
  explainEffectiveMaxHp,
  explainHitDice,
  getHitDice,
} from './progression/hitPoints'
import { explainAsiStatus, getPendingAsiLevels, hasAsiAtLevel } from './progression/asi'
import { getRulesResources } from './progression/resources'
import {
  formatRaceSpeed,
  getDragonbornAncestry,
  getDragonbornBreath,
  getRaceDefinition,
  getRaceSpeedMeters,
  getRaceLanguages,
} from './races'
import { explainSpellSlots, mergeSpellSlotUsage } from './spells/slots'
import { preparedSpellLimitForCharacter } from './spells/preparation'
import { calculateSpellAttackBonus, calculateSpellSaveDC } from './spells/spellcasting'
import { validateCharacter } from './validation/validateCharacter'
import { feetToMeters } from '../data/distances'

export interface DerivedStats {
  abilityScores: ReturnType<typeof resolveAbilityScores>['scores']
  abilityParts: ReturnType<typeof resolveAbilityScores>['parts']
  abilityModifiers: Record<string, number>
  abilityBreakdowns: Record<string, CalculationBreakdown>
  proficiencyBonus: number
  proficiencyBreakdown: CalculationBreakdown
  ac: number
  acBreakdown: CalculationBreakdown
  initiative: number
  initiativeBreakdown: CalculationBreakdown
  speed: number
  speedBreakdown: CalculationBreakdown
  maxHp: number
  rulesMaxHp: number
  maxHpBreakdown: CalculationBreakdown
  usingManualHp: boolean
  hitDice: ReturnType<typeof getHitDice>
  hitDiceBreakdown: CalculationBreakdown
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
  preparedSpellLimit: number
  preparedSpellLimitBreakdown: CalculationBreakdown
  cantripsKnownLimit: number
  maxSpellSlotLevel: number
  spellSlots: SpellSlotState[]
  spellSlotsBreakdown: CalculationBreakdown
  domainSpellIds: string[]
  saveProficiencies: ReturnType<typeof getEffectiveSaveProficiencies>
  proficiencies: {
    armor: string[]
    weapons: string[]
    tools: string[]
    languages: string[]
    other: string[]
  }
  className: string
  subclassName: string
  raceName: string
  ancestryName: string
  features: ReturnType<typeof getCharacterFeatures>
  hasAsiNow: boolean
  pendingAsiLevels: number[]
  asiBreakdown: CalculationBreakdown
  actions: ReturnType<typeof getAvailableActions>
  bonusActions: ReturnType<typeof getAvailableBonusActions>
  reactions: ReturnType<typeof getAvailableReactions>
  breath: ReturnType<typeof getDragonbornBreath>
  resources: ReturnType<typeof getRulesResources>
  issues: ReturnType<typeof validateCharacter>
}

export function syncCharacterRuntime(character: Character): Character {
  const slots = mergeSpellSlotUsage(character.classId, character.level, character.spellSlots)
  return {
    ...character,
    spellSlots: slots,
    resources: getRulesResources({ ...character, spellSlots: slots }),
  }
}

export function deriveCharacterStats(character: Character): DerivedStats {
  const abilities = resolveAbilityScores(character)
  const classDef = getClassDefinition(character.classId)
  const subclass = getSubclassDefinition(character.subclassId)
  const race = getRaceDefinition(character.raceId)
  const ancestry = getDragonbornAncestry(character.ancestryId)
  const spellAbility = classDef?.spellcastingAbility ?? 'wis'
  const spellcastingMod = calculateAbilityModifier(abilities.scores[spellAbility])
  const proficiencyBonus = character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level)
  const { ac, breakdown: acBreakdown } = calculateArmorClass(character)
  const { value: initiative, breakdown: initiativeBreakdown } = calculateInitiative(character)
  const perception = calculateSkillBonus(character, 'perception')
  const { dc: spellSaveDc, breakdown: spellSaveDcBreakdown } = calculateSpellSaveDC(
    character,
    spellcastingMod,
  )
  const { bonus: spellAttackBonus, breakdown: spellAttackBreakdown } = calculateSpellAttackBonus(
    character,
    spellcastingMod,
  )
  const rulesSpeed = getRaceSpeedMeters(character.raceId)
  const speed = character.overrides.speed ?? rulesSpeed
  const rulesHp = calculateRulesMaxHp(character)
  const maxHp = effectiveMaxHp(character)
  const prepared = preparedSpellLimitForCharacter(character)
  const spellSlots = mergeSpellSlotUsage(character.classId, character.level, character.spellSlots)
  const granted = getGrantedProficiencies(character.classId, character.subclassId)
  const languages = [
    ...new Set([...getRaceLanguages(character.raceId), ...character.extraProficiencies.languages]),
  ]
  const abilityBreakdowns: Record<string, CalculationBreakdown> = {}
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    abilityBreakdowns[key] = explainAbilityTotal(abilities.parts[key])
  }

  return {
    abilityScores: abilities.scores,
    abilityParts: abilities.parts,
    abilityModifiers: {
      str: abilities.parts.str.modifier,
      dex: abilities.parts.dex.modifier,
      con: abilities.parts.con.modifier,
      int: abilities.parts.int.modifier,
      wis: abilities.parts.wis.modifier,
      cha: abilities.parts.cha.modifier,
    },
    abilityBreakdowns,
    proficiencyBonus,
    proficiencyBreakdown: explainProficiencyBonus(character.level),
    ac,
    acBreakdown,
    initiative,
    initiativeBreakdown,
    speed,
    speedBreakdown: {
      title: 'Скорость',
      result: `${speed} м`,
      lines: [
        race
          ? `${race.name}: ${race.speedFeet} футов = ${formatRaceSpeed(character.raceId)}`
          : 'Раса не задана, используется 30 футов.',
        character.overrides.speed != null
          ? `Используется ручное значение: ${speed} м. По расе: ${feetToMeters(race?.speedFeet ?? 30)}.`
          : `Итог: ${speed} м`,
      ],
    },
    maxHp,
    rulesMaxHp: rulesHp.value,
    maxHpBreakdown: explainEffectiveMaxHp(character),
    usingManualHp: character.overrides.maxHp != null || character.hpCalculationMethod === 'manual',
    hitDice: getHitDice(character),
    hitDiceBreakdown: explainHitDice(character),
    spellcastingMod,
    spellSaveDc,
    spellSaveDcBreakdown,
    spellAttackBonus,
    spellAttackBreakdown,
    passivePerception: 10 + perception.bonus,
    passivePerceptionBreakdown: calculatePassivePerception(perception.bonus),
    skills: calculateAllSkills(character),
    saves: calculateAllSavingThrows(character),
    attacks: calculateAttacks(character),
    preparedSpellLimit: prepared.limit,
    preparedSpellLimitBreakdown: prepared.breakdown,
    cantripsKnownLimit: prepared.cantripsKnown,
    maxSpellSlotLevel: prepared.maxSlotLevel,
    spellSlots,
    spellSlotsBreakdown: explainSpellSlots(character),
    domainSpellIds: getDomainSpellIds(character.subclassId, character.level),
    saveProficiencies: getEffectiveSaveProficiencies(character),
    proficiencies: {
      armor: [...new Set([...granted.armor, ...character.extraProficiencies.armor])],
      weapons: [...new Set([...granted.weapons, ...character.extraProficiencies.weapons])],
      tools: character.extraProficiencies.tools,
      languages,
      other: character.extraProficiencies.other,
    },
    className: classDef?.name ?? character.classId,
    subclassName: subclass?.name ?? '',
    raceName: race?.name ?? '',
    ancestryName: ancestry?.name ?? '',
    features: getCharacterFeatures(character),
    hasAsiNow: hasAsiAtLevel(character.classId, character.level),
    pendingAsiLevels: getPendingAsiLevels(character),
    asiBreakdown: explainAsiStatus(character),
    actions: getAvailableActions(character),
    bonusActions: getAvailableBonusActions(character),
    reactions: getAvailableReactions(character),
    breath: getDragonbornBreath(
      character.level,
      character.ancestryId,
      abilities.scores.con,
      proficiencyBonus,
    ),
    resources: getRulesResources(character),
    issues: validateCharacter(character),
  }
}
