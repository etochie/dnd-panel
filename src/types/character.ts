export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'consumable'
  | 'magic'
  | 'tool'
  | 'other'

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight: number
  cost: string
  description: string
  equipped: boolean
  category: ItemCategory
  /** weapon / armor stats when known */
  weaponDamage?: string
  weaponDamageType?: string
  weaponProperties?: string[]
  armorBaseAc?: number
  armorMaxDex?: number | null
  armorType?: 'light' | 'medium' | 'heavy'
  shieldBonus?: number
}

export interface SpellSlotState {
  level: number
  max: number
  current: number
}

export interface ResourceState {
  id: string
  name: string
  current: number
  max: number
  /** short_rest | long_rest | other */
  recharge: 'short_rest' | 'long_rest' | 'other'
  description?: string
}

export interface ConcentrationState {
  spellId: string
  name: string
  duration: string
  summary: string
}

export interface CombatTurnState {
  actionUsed: boolean
  bonusActionUsed: boolean
  reactionUsed: boolean
  movementRemaining: number
}

export interface JournalNpc {
  id: string
  name: string
  metAt: string
  attitude: string
  description: string
  facts: string
  notes: string
}

export type QuestStatus = 'active' | 'completed' | 'failed' | 'deferred'

export interface JournalQuest {
  id: string
  title: string
  description: string
  status: QuestStatus
  notes: string
}

export interface JournalLocation {
  id: string
  name: string
  description: string
  npcs: string
  events: string
  notes: string
}

export interface Journal {
  npcs: JournalNpc[]
  facts: string
  quests: JournalQuest[]
  locations: JournalLocation[]
  generalNotes: string
}

export interface Money {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface Character {
  id: string
  name: string
  race: string
  raceDetails?: {
    dragonbornLineage?: string
    breathType?: string
  }
  classId: string
  subclassId?: string
  level: number
  background: string
  alignment: string
  notes: string
  abilities: Record<AbilityKey, number>
  skillProficiencies: string[]
  skillExpertise: string[]
  saveProficiencies: AbilityKey[]
  proficiencies: {
    armor: string[]
    weapons: string[]
    tools: string[]
    languages: string[]
    other: string[]
  }
  knownSpellIds: string[]
  preparedSpellIds: string[]
  cantripIds: string[]
  domainSpellIds: string[]
  spellSlots: SpellSlotState[]
  currentHp: number
  maxHpOverride: number | null
  tempHp: number
  hitDiceRemaining: number
  hitDieSize: number
  resources: ResourceState[]
  inventory: InventoryItem[]
  conditions: string[]
  journal: Journal
  money: Money
  speedOverride: number | null
  combat: CombatTurnState
  concentration: ConcentrationState | null
  createdAt: string
  updatedAt: string
}

export interface AppStorage {
  version: 1
  characters: Character[]
  activeCharacterId: string | null
}
