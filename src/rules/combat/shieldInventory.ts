import type { Character, InventoryItem } from '../../types/character'
import { createId } from '../../utils/id'
import { equipItemOnCharacter, itemInSlot, normalizeInventory, unequipInventoryItem } from './equipment'

const DEFAULT_SHIELD_BONUS = 2

export function findEquippedShield(character: Character): InventoryItem | undefined {
  return itemInSlot(normalizeInventory(character.inventory), 'shield')
}

export function findAnyShield(character: Character): InventoryItem | undefined {
  return character.inventory.find((item) => item.category === 'shield' || item.equipmentSlot === 'shield')
}

export function createStandardShield(): InventoryItem {
  return {
    id: createId(),
    name: 'Щит',
    quantity: 1,
    weight: 3,
    cost: '10 зм',
    description: 'Щит дает +2 к КД и занимает одну руку.',
    equipped: false,
    category: 'shield',
    equipmentSlot: 'shield',
    shieldBonus: DEFAULT_SHIELD_BONUS,
  }
}

export function equipShieldOnCharacter(character: Character): Character {
  const shield = findAnyShield(character)
  if (shield) return equipItemOnCharacter(character, shield.id).character
  const created = createStandardShield()
  return equipItemOnCharacter(
    { ...character, inventory: [...character.inventory, created] },
    created.id,
  ).character
}

export function unequipShieldOnCharacter(character: Character): Character {
  const shield = findEquippedShield(character)
  if (!shield) return character
  return { ...character, inventory: unequipInventoryItem(character.inventory, shield.id) }
}
