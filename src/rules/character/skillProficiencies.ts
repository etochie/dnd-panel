import { backgroundSkillIds } from '../../data/backgrounds'
import type { Character } from '../../types/character'
import { getClassDefinition } from '../classes'

export interface SkillSelectionLimits {
  grantedSkillIds: string[]
  classOptionIds: string[]
  classPickCount: number
  maxTotalSkills: number
  classPicksUsed: (skillProficiencies: string[]) => number
  isGranted: (skillId: string) => boolean
  canToggleClassSkill: (skillId: string, skillProficiencies: string[]) => boolean
}

export function getSkillSelectionLimits(character: Character): SkillSelectionLimits {
  const grantedSkillIds = backgroundSkillIds(character.background)
  const classDef = getClassDefinition(character.classId)
  const classOptionIds = classDef?.skillChoices.options ?? []
  const classPickCount = classDef?.skillChoices.count ?? 0
  const maxTotalSkills = grantedSkillIds.length + classPickCount

  const classPicksUsed = (skillProficiencies: string[]) =>
    skillProficiencies.filter(
      (id) => classOptionIds.includes(id) && !grantedSkillIds.includes(id),
    ).length

  const isGranted = (skillId: string) => grantedSkillIds.includes(skillId)

  const canToggleClassSkill = (skillId: string, skillProficiencies: string[]) => {
    if (!classOptionIds.includes(skillId)) return false
    if (grantedSkillIds.includes(skillId)) return false
    const selected = skillProficiencies.includes(skillId)
    if (selected) return true
    return classPicksUsed(skillProficiencies) < classPickCount
  }

  return {
    grantedSkillIds,
    classOptionIds,
    classPickCount,
    maxTotalSkills,
    classPicksUsed,
    isGranted,
    canToggleClassSkill,
  }
}

/** Навыки предыстории всегда в списке; лишние классовые снимаются при смене класса/предыстории */
export function reconcileSkillProficiencies(character: Character): string[] {
  const limits = getSkillSelectionLimits(character)
  const granted = new Set(limits.grantedSkillIds)
  const classPicks: string[] = []
  for (const id of character.skillProficiencies) {
    if (granted.has(id)) continue
    if (!limits.classOptionIds.includes(id)) continue
    if (classPicks.includes(id)) continue
    if (classPicks.length >= limits.classPickCount) continue
    classPicks.push(id)
  }
  return [...limits.grantedSkillIds, ...classPicks]
}

export function toggleClassSkill(
  skillProficiencies: string[],
  skillId: string,
  character: Character,
): string[] {
  const limits = getSkillSelectionLimits(character)
  if (limits.isGranted(skillId)) return reconcileSkillProficiencies({ ...character, skillProficiencies })
  if (!limits.classOptionIds.includes(skillId)) return skillProficiencies

  const withGranted = reconcileSkillProficiencies({ ...character, skillProficiencies })
  const selected = withGranted.includes(skillId)
  if (selected) {
    return withGranted.filter((id) => id !== skillId)
  }
  if (!limits.canToggleClassSkill(skillId, withGranted)) return withGranted
  return [...withGranted, skillId]
}
