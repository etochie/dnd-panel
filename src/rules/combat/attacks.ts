import type { Character, InventoryItem } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { getProficiencyBonus } from '../core/proficiency'
import { resolveAbilityScores } from '../generation/resolveAbilities'

export interface AttackView {
  id: string
  name: string
  type: string
  range: string
  attackBonus: number
  damage: string
  damageType: string
  properties: string[]
  description: string
  breakdown: CalculationBreakdown
}

function weaponAttack(character: Character, item: InventoryItem): AttackView {
  const scores = resolveAbilityScores(character).scores
  const strMod = calculateAbilityModifier(scores.str)
  const prof = character.overrides.proficiencyBonus ?? getProficiencyBonus(character.level)
  const attackBonus = prof + strMod
  const damage = item.weaponDamage ?? '1d6'
  const damageType = item.weaponDamageType ?? 'дробящий'
  return {
    id: item.id,
    name: item.name,
    type: 'Оружие',
    range: '1,5 м',
    attackBonus,
    damage: `${damage} + ${strMod} ${damageType}`,
    damageType,
    properties: item.weaponProperties ?? [],
    description: item.description,
    breakdown: {
      title: `Бонус атаки: ${item.name}`,
      result: formatModifier(attackBonus),
      lines: [
        `Бонус мастерства: ${formatModifier(prof)}`,
        `Сила: ${formatModifier(strMod)}`,
        `${formatModifier(prof)} + ${formatModifier(strMod)} = ${formatModifier(attackBonus)}`,
      ],
    },
  }
}

export function calculateAttacks(character: Character): AttackView[] {
  return character.inventory
    .filter((item) => item.equipped && item.category === 'weapon')
    .map((item) => weaponAttack(character, item))
}
