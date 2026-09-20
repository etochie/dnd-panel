export { ABILITY_LABELS, calculateAbilityModifier, explainAbilityModifier, formatModifier } from './core/abilities'
export { calculateProficiencyBonus, explainProficiencyBonus, getProficiencyBonus } from './core/proficiency'
export { ABILITY_KEYS, EMPTY_ABILITIES } from './core/types'
export type { AbilityGenerationMethod, AsiChoice, HpCalculationMethod, ManualOverrides } from './core/types'

export {
  CLASSES,
  SUBCLASSES,
  classGainsAsiAtLevel,
  domainSpellIdsForLevel,
  earnedAsiLevels,
  getAbilityScoreImprovementLevels,
  getCantripsKnown,
  getChannelDivinityUses,
  getClassDefinition,
  getClassFeatures,
  getClassHitDie,
  getClassSpellSlots,
  getDomainSpellIds,
  getGrantedProficiencies,
  getPreparedSpellCount,
  getSubclassDefinition,
  getSubclassFeatures,
  subclassesForClass,
} from './classes'

export {
  RACES,
  ancestryIdFromLegacy,
  formatRaceSpeed,
  getDragonbornAncestry,
  getDragonbornBreath,
  getRaceDefinition,
  getRacialAbilityBonuses,
  getRacialFeatures,
  getRaceSpeedMeters,
  raceIdFromLegacyName,
} from './races'
export { DRAGONBORN_ANCESTRIES } from './races/dragonborn'

export { calculateArmorClass, calculateInitiative, calculatePassivePerception } from './combat/armorClass'
export { calculateAllSavingThrows, calculateSavingThrow, getEffectiveSaveProficiencies } from './combat/saves'
export { calculateAllSkills, calculateSkillBonus } from './combat/skills'
export { calculateAttacks } from './combat/attacks'
export { getAvailableActions, getAvailableBonusActions, getAvailableReactions } from './combat/actions'

export { calculateRulesMaxHp, effectiveMaxHp, explainEffectiveMaxHp, getHitDice } from './progression/hitPoints'
export {
  createFeatChoice,
  createPlusOnePlusOneChoice,
  createPlusTwoChoice,
  explainAsiStatus,
  getPendingAsiLevels,
  hasAsiAtLevel,
} from './progression/asi'
export { applyLevelUp, previewLevelUp } from './progression/levelUp'
export { getRulesResources, withSyncedResources } from './progression/resources'

export { POINT_BUY_LIMIT, POINT_BUY_MAX, POINT_BUY_MIN, pointBuyCostForScore, pointBuySpent } from './generation/pointBuy'
export { STANDARD_ARRAY, isStandardArrayAssignment } from './generation/standardArray'
export { explainAbilityTotal, resolveAbilityScores } from './generation/resolveAbilities'

export { explainSpellSlots, getSpellSlots, mergeSpellSlotUsage } from './spells/slots'
export { preparedSpellLimitForCharacter } from './spells/preparation'
export { calculateSpellAttackBonus, calculateSpellSaveDC } from './spells/spellcasting'

export { validateCharacter } from './validation/validateCharacter'
export { deriveCharacterStats, syncCharacterRuntime } from './derive'
export type { DerivedStats } from './derive'
