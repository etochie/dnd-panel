import type { Character, InventoryItem } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { calculateAbilityModifier, formatModifier } from './abilities'
import { calculateProficiencyBonus } from './proficiency'

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
  const strMod = calculateAbilityModifier(character.abilities.str)
  const prof = calculateProficiencyBonus(character.level)
  const attackBonus = prof + strMod
  const damage = item.weaponDamage ?? '1d6'
  const damageType = item.weaponDamageType ?? 'дробящий'
  const strPart = strMod
  const damageDisplay = `${damage} + ${strPart} ${damageType}`
  return {
    id: item.id,
    name: item.name,
    type: 'Оружие',
    range: '1,5 м',
    attackBonus,
    damage: damageDisplay.trim(),
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
    .filter((i) => i.equipped && i.category === 'weapon')
    .map((i) => weaponAttack(character, i))
}
