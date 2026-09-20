import { SKILLS_2014 } from '../../data/skills'
import type { Character } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getProficiencyBonus } from '../core/proficiency'
import { resolveAbilityScores } from '../generation/resolveAbilities'

export interface SkillResult {
  id: string
  name: string
  ability: string
  bonus: number
  proficient: boolean
  expertise: boolean
  breakdown: CalculationBreakdown
}

export function calculateSkillBonus(character: Character, skillId: string): SkillResult {
  const def = SKILLS_2014.find((item) => item.id === skillId)
  if (!def) {
    return {
      id: skillId,
      name: skillId,
      ability: '',
      bonus: 0,
      proficient: false,
      expertise: false,
      breakdown: { title: 'Навык', result: '0', lines: ['Неизвестный навык'], unknown: true },
    }
  }
  const abilityMod = calculateAbilityModifier(resolveAbilityScores(character).scores[def.ability])
  const proficient = character.skillProficiencies.includes(skillId)
  const expertise = character.skillExpertise.includes(skillId)
  const profBonus = character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level)
  let profPart = 0
  const lines = [`Модификатор ${ABILITY_LABELS[def.ability]}: ${formatModifier(abilityMod)}`]
  if (expertise) {
    profPart = profBonus * 2
    lines.push(`Компетентность: удвоенный бонус мастерства ${formatModifier(profPart)}`)
  } else if (proficient) {
    profPart = profBonus
    lines.push(`Владение: бонус мастерства ${formatModifier(profPart)}`)
  } else {
    lines.push('Нет владения навыком')
  }
  const bonus = abilityMod + profPart
  lines.push(`Итого: ${formatModifier(bonus)}`)
  return {
    id: skillId,
    name: def.name,
    ability: ABILITY_LABELS[def.ability],
    bonus,
    proficient,
    expertise,
    breakdown: { title: `Навык "${def.name}"`, result: formatModifier(bonus), lines },
  }
}

export function calculateAllSkills(character: Character): SkillResult[] {
  return SKILLS_2014.map((item) => calculateSkillBonus(character, item.id))
}
