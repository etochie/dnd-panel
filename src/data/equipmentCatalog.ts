import type { InventoryItem, ItemCategory } from '../types/character'
import { createId } from '../utils/id'

export interface CatalogEntry {
  id: string
  name: string
  aliases?: string[]
  category: ItemCategory
  weight: number
  cost: string
  description: string
  equipmentSlot: string
  armorBaseAc?: number
  armorType?: 'light' | 'medium' | 'heavy'
  armorMaxDex?: number | null
  strengthRequirement?: number
  shieldBonus?: number
  weaponDamage?: string
  weaponDamageType?: string
  weaponProperties?: string[]
}

export const EQUIPMENT_CATALOG: CatalogEntry[] = [
  {
    id: 'padded',
    name: 'Стеганый доспех',
    category: 'armor',
    weight: 4,
    cost: '5 зм',
    description: 'Легкая броня. КД 11 + модификатор ловкости. Помеха на Скрытность.',
    equipmentSlot: 'armor',
    armorBaseAc: 11,
    armorType: 'light',
  },
  {
    id: 'leather',
    name: 'Кожаный доспех',
    aliases: ['leather', 'leather armor'],
    category: 'armor',
    weight: 5,
    cost: '10 зм',
    description: 'Легкая броня. КД 11 + модификатор ловкости.',
    equipmentSlot: 'armor',
    armorBaseAc: 11,
    armorType: 'light',
  },
  {
    id: 'studded',
    name: 'Клепаный кожаный доспех',
    category: 'armor',
    weight: 6,
    cost: '45 зм',
    description: 'Легкая броня. КД 12 + модификатор ловкости.',
    equipmentSlot: 'armor',
    armorBaseAc: 12,
    armorType: 'light',
  },
  {
    id: 'hide',
    name: 'Шкурный доспех',
    category: 'armor',
    weight: 6,
    cost: '10 зм',
    description: 'Средняя броня. КД 12 + модификатор ловкости, не выше +2.',
    equipmentSlot: 'armor',
    armorBaseAc: 12,
    armorType: 'medium',
    armorMaxDex: 2,
  },
  {
    id: 'chain_shirt',
    name: 'Кольчужная рубаха',
    category: 'armor',
    weight: 9,
    cost: '50 зм',
    description: 'Средняя броня. КД 13 + модификатор ловкости, не выше +2.',
    equipmentSlot: 'armor',
    armorBaseAc: 13,
    armorType: 'medium',
    armorMaxDex: 2,
  },
  {
    id: 'scale',
    name: 'Чешуйчатый доспех',
    aliases: ['scale mail'],
    category: 'armor',
    weight: 20,
    cost: '50 зм',
    description: 'Средняя броня. КД 14 + модификатор ловкости, не выше +2. Помеха на Скрытность.',
    equipmentSlot: 'armor',
    armorBaseAc: 14,
    armorType: 'medium',
    armorMaxDex: 2,
  },
  {
    id: 'breastplate',
    name: 'Кираса',
    category: 'armor',
    weight: 9,
    cost: '400 зм',
    description: 'Средняя броня. КД 14 + модификатор ловкости, не выше +2.',
    equipmentSlot: 'armor',
    armorBaseAc: 14,
    armorType: 'medium',
    armorMaxDex: 2,
  },
  {
    id: 'half_plate',
    name: 'Полулаты',
    category: 'armor',
    weight: 18,
    cost: '750 зм',
    description: 'Средняя броня. КД 15 + модификатор ловкости, не выше +2. Помеха на Скрытность.',
    equipmentSlot: 'armor',
    armorBaseAc: 15,
    armorType: 'medium',
    armorMaxDex: 2,
  },
  {
    id: 'ring_mail',
    name: 'Кольчатый доспех',
    category: 'armor',
    weight: 18,
    cost: '30 зм',
    description: 'Тяжелая броня. КД 14. Ловкость не добавляется. Помеха на Скрытность.',
    equipmentSlot: 'armor',
    armorBaseAc: 14,
    armorType: 'heavy',
    armorMaxDex: null,
  },
  {
    id: 'chain_mail',
    name: 'Кольчуга',
    aliases: ['chain mail', 'chainmail'],
    category: 'armor',
    weight: 25,
    cost: '75 зм',
    description: 'Тяжелая броня. КД 16. Ловкость не добавляется. Нужна Сила 13, иначе скорость ниже.',
    equipmentSlot: 'armor',
    armorBaseAc: 16,
    armorType: 'heavy',
    armorMaxDex: null,
    strengthRequirement: 13,
  },
  {
    id: 'splint',
    name: 'Наборный доспех',
    category: 'armor',
    weight: 27,
    cost: '200 зм',
    description: 'Тяжелая броня. КД 17. Ловкость не добавляется. Нужна Сила 15.',
    equipmentSlot: 'armor',
    armorBaseAc: 17,
    armorType: 'heavy',
    armorMaxDex: null,
    strengthRequirement: 15,
  },
  {
    id: 'plate',
    name: 'Латы',
    aliases: ['plate', 'plate armor', 'латный доспех'],
    category: 'armor',
    weight: 30,
    cost: '1500 зм',
    description: 'Тяжелая броня. КД 18. Ловкость не добавляется. Нужна Сила 15.',
    equipmentSlot: 'armor',
    armorBaseAc: 18,
    armorType: 'heavy',
    armorMaxDex: null,
    strengthRequirement: 15,
  },
  {
    id: 'shield',
    name: 'Щит',
    aliases: ['shield'],
    category: 'shield',
    weight: 3,
    cost: '10 зм',
    description: 'Щит дает +2 к КД и занимает одну руку.',
    equipmentSlot: 'shield',
    shieldBonus: 2,
  },
  {
    id: 'mace',
    name: 'Булава',
    category: 'weapon',
    weight: 2,
    cost: '5 зм',
    description: 'Простое рукопашное оружие, одна рука.',
    equipmentSlot: 'one_hand',
    weaponDamage: '1d6',
    weaponDamageType: 'дробящего',
    weaponProperties: [],
  },
  {
    id: 'longsword',
    name: 'Длинный меч',
    category: 'weapon',
    weight: 1.5,
    cost: '15 зм',
    description: 'Военное рукопашное оружие. Одной рукой 1d8, двумя руками 1d10.',
    equipmentSlot: 'versatile',
    weaponDamage: '1d8',
    weaponDamageType: 'рубящего',
    weaponProperties: ['универсальное'],
  },
  {
    id: 'greatsword',
    name: 'Двуручный меч',
    category: 'weapon',
    weight: 3,
    cost: '50 зм',
    description: 'Военное рукопашное оружие. Занимает обе руки.',
    equipmentSlot: 'two_hands',
    weaponDamage: '2d6',
    weaponDamageType: 'рубящего',
    weaponProperties: ['двуручное'],
  },
]

export function findCatalogEntryByName(name: string): CatalogEntry | undefined {
  const key = name.trim().toLowerCase()
  if (!key) return undefined
  return EQUIPMENT_CATALOG.find(
    (entry) => entry.name.toLowerCase() === key || entry.aliases?.some((alias) => alias === key),
  )
}

export function createCatalogItem(entryId: string): InventoryItem | null {
  const entry = EQUIPMENT_CATALOG.find((item) => item.id === entryId)
  if (!entry) return null
  return {
    id: createId(),
    name: entry.name,
    quantity: 1,
    weight: entry.weight,
    cost: entry.cost,
    description: entry.description,
    equipped: false,
    category: entry.category,
    equipmentSlot: entry.equipmentSlot,
    weaponDamage: entry.weaponDamage,
    weaponDamageType: entry.weaponDamageType,
    weaponProperties: entry.weaponProperties,
    armorBaseAc: entry.armorBaseAc,
    armorMaxDex: entry.armorMaxDex,
    armorType: entry.armorType,
    strengthRequirement: entry.strengthRequirement,
    shieldBonus: entry.shieldBonus,
  }
}
