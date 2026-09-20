import type { AbilityKey } from '../../types/character'
import type { RuleFeature } from '../core/types'

export interface ClassProgressionRow {
  level: number
  cantripsKnown: number
  spellSlots: number[]
  features: string[]
  channelDivinity: number
  destroyUndeadCr: string | null
}

export interface ClassSkillChoices {
  count: number
  options: string[]
}

export interface ClassDefinition {
  id: string
  name: string
  hitDie: number
  spellcastingAbility: AbilityKey | null
  spellcastingKind: 'full' | 'half' | 'third' | 'pact' | 'none'
  saveProficiencies: AbilityKey[]
  armorProficiencies: string[]
  weaponProficiencies: string[]
  skillChoices: ClassSkillChoices
  asiLevels: number[]
  subclassLevel: number
  features: RuleFeature[]
  progression: Record<number, ClassProgressionRow>
}

export interface DomainSpellEntry {
  characterLevel: number
  spellIds: string[]
}

export interface SubclassDefinition {
  id: string
  classId: string
  name: string
  features: RuleFeature[]
  domainSpells?: DomainSpellEntry[]
  extraArmorProficiencies?: string[]
  extraWeaponProficiencies?: string[]
}
