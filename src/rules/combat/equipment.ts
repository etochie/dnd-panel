import type { Character, InventoryItem } from '../../types/character'

export interface EquipmentSlotDefinition {
  id: string
  label: string
}

const CORE_SLOTS: EquipmentSlotDefinition[] = [
  { id: 'armor', label: 'броня' },
  { id: 'shield', label: 'щит' },
  { id: 'right_hand', label: 'правая рука' },
  { id: 'left_hand', label: 'левая рука' },
  { id: 'head', label: 'голова' },
  { id: 'cloak', label: 'плащ' },
  { id: 'amulet', label: 'амулет' },
  { id: 'ring_1', label: 'кольцо 1' },
  { id: 'ring_2', label: 'кольцо 2' },
  { id: 'gloves', label: 'перчатки' },
  { id: 'boots', label: 'обувь' },
  { id: 'other', label: 'прочая экипировка' },
]

const extraSlots: EquipmentSlotDefinition[] = []

const WEAR_LABELS: Record<string, string> = {
  one_hand: 'одна рука',
  two_hands: 'две руки',
  versatile: 'универсальное, одна рука',
  ring: 'кольцо',
}

export function registerEquipmentSlot(id: string, label: string) {
  const cleanId = id.trim()
  if (!cleanId) return
  if (CORE_SLOTS.some((slot) => slot.id === cleanId)) return
  if (extraSlots.some((slot) => slot.id === cleanId)) return
  extraSlots.push({ id: cleanId, label: label.trim() || cleanId })
}

export function listEquipmentSlots(): EquipmentSlotDefinition[] {
  return [...CORE_SLOTS, ...extraSlots]
}

export function equipmentSlotLabel(slotId: string): string {
  return (
    listEquipmentSlots().find((slot) => slot.id === slotId)?.label ??
    WEAR_LABELS[slotId] ??
    slotId
  )
}

export function describeItemWear(item: InventoryItem): string {
  if (item.equipped && item.equippedSlots && item.equippedSlots.length > 0) {
    return item.equippedSlots.map((slot) => equipmentSlotLabel(slot)).join(', ')
  }
  const wear = resolveWearTarget(item)
  if (!wear) return 'не носится'
  return equipmentSlotLabel(wear)
}

function hasWeaponProperty(item: InventoryItem, names: string[]): boolean {
  const props = (item.weaponProperties ?? []).map((value) => value.toLowerCase())
  return names.some((name) => props.includes(name))
}

export function inferWearTarget(item: InventoryItem): string | null {
  if (item.category === 'armor') return 'armor'
  if (item.category === 'shield') return 'shield'
  if (item.category === 'weapon') {
    if (hasWeaponProperty(item, ['two-handed', 'two handed', 'двуручное'])) return 'two_hands'
    if (hasWeaponProperty(item, ['versatile', 'универсальное'])) return 'versatile'
    return 'one_hand'
  }
  return null
}

export function resolveWearTarget(item: InventoryItem): string | null {
  if (item.equipmentSlot === '') return null
  if (item.equipmentSlot) return item.equipmentSlot
  return inferWearTarget(item)
}

function stableId(item: InventoryItem, index: number, used: Set<string>): string {
  const base = item.id?.trim() ? item.id.trim() : `legacy-${index}-${item.name || 'item'}`
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  const unique = `${base}-${index}`
  used.add(unique)
  return unique
}

function prepareItem(item: InventoryItem, index: number, used: Set<string>): InventoryItem {
  const wear = item.equipmentSlot === '' ? '' : item.equipmentSlot || inferWearTarget(item) || undefined
  const shieldBonus =
    item.category === 'shield' && item.shieldBonus == null ? 2 : item.shieldBonus
  return {
    ...item,
    id: stableId(item, index, used),
    quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1,
    equipmentSlot: wear,
    shieldBonus,
    equipped: item.equipped === true,
  }
}

function chooseOpenSlot(
  occupied: Map<string, InventoryItem>,
  candidates: string[],
  forcedSlots: string[],
  replace: boolean,
): string {
  const canTake = (slotId: string) => {
    const holder = occupied.get(slotId)
    if (!holder) return true
    if (!replace) return false
    return (holder.equippedSlots ?? []).some((slot) => forcedSlots.includes(slot))
  }
  for (const slotId of candidates) {
    if (canTake(slotId)) return slotId
  }
  return candidates[0]
}

function planSlots(
  item: InventoryItem,
  occupied: Map<string, InventoryItem>,
  replace: boolean,
): string[] {
  const wear = resolveWearTarget(item)
  if (!wear) return []
  if (wear === 'two_hands') return ['right_hand', 'left_hand']
  if (wear === 'one_hand' || wear === 'versatile') {
    return [chooseOpenSlot(occupied, ['right_hand', 'left_hand'], [], replace)]
  }
  if (wear === 'shield') {
    return ['shield', chooseOpenSlot(occupied, ['left_hand', 'right_hand'], ['shield'], replace)]
  }
  if (wear === 'ring') {
    return [chooseOpenSlot(occupied, ['ring_1', 'ring_2'], [], replace)]
  }
  if (wear === 'armor') return ['armor']
  return [wear]
}

function takeSlots(item: InventoryItem, occupied: Map<string, InventoryItem>): InventoryItem {
  const slots = planSlots(item, occupied, false)
  if (slots.length === 0 || slots.some((slot) => occupied.has(slot))) {
    return { ...item, equipped: false, equippedSlots: undefined }
  }
  const worn = { ...item, equipped: true, equippedSlots: slots }
  for (const slot of slots) occupied.set(slot, worn)
  return worn
}

export function normalizeInventory(items: InventoryItem[]): InventoryItem[] {
  const used = new Set<string>()
  const prepared = items.map((item, index) => prepareItem(item, index, used))
  const occupied = new Map<string, InventoryItem>()
  return prepared.map((item) => {
    if (!item.equipped) return { ...item, equippedSlots: undefined }
    return takeSlots(item, occupied)
  })
}

function occupancy(items: InventoryItem[], exceptId: string): Map<string, InventoryItem> {
  const map = new Map<string, InventoryItem>()
  for (const item of items) {
    if (!item.equipped || item.id === exceptId) continue
    for (const slot of item.equippedSlots ?? []) map.set(slot, item)
  }
  return map
}

export interface EquipResult {
  items: InventoryItem[]
  warnings: string[]
  replacedNames: string[]
}

export function equipInventoryItem(items: InventoryItem[], itemId: string): EquipResult {
  const normalized = normalizeInventory(items)
  const item = normalized.find((entry) => entry.id === itemId)
  if (!item) {
    return { items: normalized, warnings: ['Предмет не найден.'], replacedNames: [] }
  }
  if (!resolveWearTarget(item)) {
    return {
      items: normalized,
      warnings: ['Этот предмет нельзя надеть. Выберите слот, если его можно носить.'],
      replacedNames: [],
    }
  }
  if (item.equipped) {
    return { items: normalized, warnings: [], replacedNames: [] }
  }

  const occupied = occupancy(normalized, item.id)
  const slots = planSlots(item, occupied, true)
  const replacedIds = new Set<string>()
  for (const slot of slots) {
    const holder = occupied.get(slot)
    if (holder) replacedIds.add(holder.id)
  }

  const replacedNames = normalized
    .filter((entry) => replacedIds.has(entry.id))
    .map((entry) => entry.name)

  const next = normalized.map((entry) => {
    if (replacedIds.has(entry.id)) {
      return { ...entry, equipped: false, equippedSlots: undefined }
    }
    if (entry.id === item.id) {
      return { ...entry, equipped: true, equippedSlots: slots }
    }
    return entry
  })

  const warnings: string[] = []
  if (replacedNames.length > 0) {
    const bothHands = slots.includes('right_hand') && slots.includes('left_hand')
    warnings.push(
      bothHands
        ? `Обе руки заняты этим предметом, поэтому снято: ${replacedNames.join(', ')}.`
        : `Освобождены только конфликтующие слоты. Снято: ${replacedNames.join(', ')}.`,
    )
  }

  return { items: normalizeInventory(next), warnings, replacedNames }
}

export function unequipInventoryItem(items: InventoryItem[], itemId: string): InventoryItem[] {
  const next = items.map((item) =>
    item.id === itemId ? { ...item, equipped: false, equippedSlots: undefined } : item,
  )
  return normalizeInventory(next)
}

export function equipItemOnCharacter(
  character: Character,
  itemId: string,
): { character: Character; warnings: string[]; replacedNames: string[] } {
  const result = equipInventoryItem(character.inventory, itemId)
  return {
    character: { ...character, inventory: result.items },
    warnings: result.warnings,
    replacedNames: result.replacedNames,
  }
}

export function unequipItemOnCharacter(character: Character, itemId: string): Character {
  return { ...character, inventory: unequipInventoryItem(character.inventory, itemId) }
}

export function itemInSlot(items: InventoryItem[], slotId: string): InventoryItem | undefined {
  return items.find((item) => item.equipped && item.equippedSlots?.includes(slotId))
}

export function slotsForDisplay(items: InventoryItem[]): EquipmentSlotDefinition[] {
  const known = listEquipmentSlots()
  const knownIds = new Set(known.map((slot) => slot.id))
  const extra: EquipmentSlotDefinition[] = []
  for (const item of items) {
    for (const slotId of item.equippedSlots ?? []) {
      if (!knownIds.has(slotId) && !extra.some((slot) => slot.id === slotId)) {
        extra.push({ id: slotId, label: equipmentSlotLabel(slotId) })
      }
    }
  }
  return [...known, ...extra]
}
