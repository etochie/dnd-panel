import type { Character, InventoryItem } from '../../types/character'
import { createId } from '../../utils/id'

const DEFAULT_SHIELD_BONUS = 2

export function findEquippedShield(character: Character): InventoryItem | undefined {
  return character.inventory.find((item) => item.equipped && item.category === 'shield')
}

export function findAnyShield(character: Character): InventoryItem | undefined {
  return character.inventory.find((item) => item.category === 'shield')
}

export function createStandardShield(): InventoryItem {
  return {
    id: createId(),
    name: 'Щит',
    quantity: 1,
    weight: 3,
    cost: '10 зм',
    description: 'Щит +2 к КД при владении и экипировке.',
    equipped: false,
    category: 'shield',
    shieldBonus: DEFAULT_SHIELD_BONUS,
  }
}

export function equipShieldOnCharacter(character: Character): Character {
  const shield = findAnyShield(character)
  if (shield) {
    return {
      ...character,
      inventory: character.inventory.map((item) => {
        if (item.category !== 'shield') return item
        return { ...item, equipped: item.id === shield.id }
      }),
    }
  }

  const newShield = createStandardShield()
  newShield.equipped = true
  return { ...character, inventory: [...character.inventory, newShield] }
}

export function unequipShieldOnCharacter(character: Character): Character {
  return {
    ...character,
    inventory: character.inventory.map((item) =>
      item.category === 'shield' ? { ...item, equipped: false } : item,
    ),
  }
}
