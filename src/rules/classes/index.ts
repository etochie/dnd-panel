import { CLERIC_CLASS, getClericSpellSlots } from './cleric'
import { DEATH_DOMAIN, domainSpellIdsForLevel } from './deathDomain'
import type { ClassDefinition, SubclassDefinition } from './types'
import { getProficiencyBonus } from '../core/proficiency'

export type { ClassDefinition, ClassProgressionRow, SubclassDefinition } from './types'

export const CLASSES: ClassDefinition[] = [CLERIC_CLASS]
export const SUBCLASSES: SubclassDefinition[] = [DEATH_DOMAIN]

export function getClassDefinition(classId: string): ClassDefinition | undefined {
  return CLASSES.find((item) => item.id === classId)
}

export function getSubclassDefinition(id: string | undefined): SubclassDefinition | undefined {
  if (!id) return undefined
  return SUBCLASSES.find((item) => item.id === id)
}

export function subclassesForClass(classId: string): SubclassDefinition[] {
  return SUBCLASSES.filter((item) => item.classId === classId)
}

export function getClassHitDie(classId: string): number {
  return getClassDefinition(classId)?.hitDie ?? 8
}

export function getAbilityScoreImprovementLevels(classId: string): number[] {
  return getClassDefinition(classId)?.asiLevels ?? []
}

export function classGainsAsiAtLevel(classId: string, level: number): boolean {
  return getAbilityScoreImprovementLevels(classId).includes(level)
}

export function earnedAsiLevels(classId: string, level: number): number[] {
  return getAbilityScoreImprovementLevels(classId).filter((asiLevel) => asiLevel <= level)
}

export function getClassFeatures(classId: string, level: number) {
  const definition = getClassDefinition(classId)
  if (!definition) return []
  return definition.features.filter((feature) => feature.level <= level)
}

export function getSubclassFeatures(subclassId: string | undefined, level: number) {
  const definition = getSubclassDefinition(subclassId)
  if (!definition) return []
  return definition.features.filter((feature) => feature.level <= level)
}

export function getClassSpellSlots(classId: string, level: number): number[] {
  if (classId === 'cleric') return getClericSpellSlots(level)
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

export function getDomainSpellIds(subclassId: string | undefined, level: number): string[] {
  const definition = getSubclassDefinition(subclassId)
  if (!definition?.domainSpells) return []
  if (definition.id === 'death_domain') return domainSpellIdsForLevel(level)
  return definition.domainSpells
    .filter((entry) => entry.characterLevel <= level)
    .flatMap((entry) => entry.spellIds)
}

export function getClassProgressionRow(classId: string, level: number) {
  return getClassDefinition(classId)?.progression[Math.min(20, Math.max(1, level))]
}

export function getChannelDivinityUses(classId: string, level: number): number {
  return getClassProgressionRow(classId, level)?.channelDivinity ?? 0
}

export function getCantripsKnown(classId: string, level: number): number {
  return getClassProgressionRow(classId, level)?.cantripsKnown ?? 0
}

export function getClassSaveProficiencies(classId: string) {
  return getClassDefinition(classId)?.saveProficiencies ?? []
}

export function getGrantedProficiencies(classId: string, subclassId?: string) {
  const classDef = getClassDefinition(classId)
  const subclass = getSubclassDefinition(subclassId)
  return {
    armor: [...(classDef?.armorProficiencies ?? []), ...(subclass?.extraArmorProficiencies ?? [])],
    weapons: [
      ...(classDef?.weaponProficiencies ?? []),
      ...(subclass?.extraWeaponProficiencies ?? []),
    ],
  }
}

export function getPreparedSpellCount(
  classId: string,
  classLevel: number,
  spellcastingModifier: number,
): number {
  if (classId !== 'cleric') return 0
  return Math.max(1, classLevel + spellcastingModifier)
}

export { getProficiencyBonus, domainSpellIdsForLevel }
