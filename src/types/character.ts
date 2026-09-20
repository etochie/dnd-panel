export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type AbilityGenerationMethod = 'standard_array' | 'point_buy' | 'manual'
export type HpCalculationMethod = 'fixed' | 'rolled' | 'manual'

export interface ManualOverrides {
  maxHp?: number
  speed?: number
  proficiencyBonus?: number
  spellSaveDc?: number
  spellAttackBonus?: number
}

export interface AsiScoreChoice {
  kind: 'scores'
  increases: Partial<Record<AbilityKey, number>>
}

export interface AsiFeatChoice {
  kind: 'feat'
  featId: string
  featName: string
}

export type AsiChoice = {
  level: number
} & (AsiScoreChoice | AsiFeatChoice)

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

export interface ExtraProficiencies {
  armor: string[]
  weapons: string[]
  tools: string[]
  languages: string[]
  other: string[]
}

export interface Character {
  id: string
  name: string
  raceId: string
  ancestryId?: string
  classId: string
  subclassId?: string
  level: number
  background: string
  alignment: string
  notes: string
  abilityGenerationMethod: AbilityGenerationMethod
  baseAbilities: Record<AbilityKey, number>
  asiChoices: AsiChoice[]
  allowFeats: boolean
  hpCalculationMethod: HpCalculationMethod
  hpRolls: Record<string, number>
  skillProficiencies: string[]
  skillExpertise: string[]
  extraSaveProficiencies: AbilityKey[]
  extraProficiencies: ExtraProficiencies
  knownSpellIds: string[]
  preparedSpellIds: string[]
  cantripIds: string[]
  spellSlots: SpellSlotState[]
  currentHp: number
  tempHp: number
  hitDiceRemaining: number
  resources: ResourceState[]
  inventory: InventoryItem[]
  conditions: string[]
  journal: Journal
  money: Money
  combat: CombatTurnState
  concentration: ConcentrationState | null
  overrides: ManualOverrides
  createdAt: string
  updatedAt: string
}

export interface AppStorage {
  version: 2
  characters: Character[]
  activeCharacterId: string | null
}
