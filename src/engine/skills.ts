import { SKILLS_2014 } from '../data/skills'
import type { Character } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { ABILITY_LABELS, calculateAbilityModifier, formatModifier } from './abilities'
import { calculateProficiencyBonus } from './proficiency'

export interface SkillResult {
  id: string
  name: string
  ability: string
  bonus: number
  proficient: boolean
  expertise: boolean
  breakdown: CalculationBreakdown
}

export function calculateSkillBonus(
  character: Character,
  skillId: string,
): SkillResult {
  const def = SKILLS_2014.find((s) => s.id === skillId)
  if (!def) {
    return {
      id: skillId,
      name: skillId,
      ability: '',
      bonus: 0,
      proficient: false,
      expertise: false,
      breakdown: {
        title: 'Навык',
        result: '0',
        lines: ['Неизвестный навык'],
        unknown: true,
      },
    }
  }
  const abilityMod = calculateAbilityModifier(character.abilities[def.ability])
  const proficient = character.skillProficiencies.includes(skillId)
  const expertise = character.skillExpertise.includes(skillId)
  const profBonus = calculateProficiencyBonus(character.level)
  let profPart = 0
  const lines: string[] = [
    `Модификатор ${ABILITY_LABELS[def.ability]}: ${formatModifier(abilityMod)}`,
  ]
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
    breakdown: {
      title: `Навык «${def.name}»`,
      result: formatModifier(bonus),
      lines,
    },
  }
}

export function calculateAllSkills(character: Character): SkillResult[] {
  return SKILLS_2014.map((s) => calculateSkillBonus(character, s.id))
}
