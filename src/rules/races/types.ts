import type { AbilityKey } from '../../types/character'
import type { RuleFeature } from '../core/types'

export type BreathShape = 'cone' | 'line'

export interface DragonAncestry {
  id: string
  name: string
  damageType: string
  damageTypeId: string
  breathShape: BreathShape
  breathFeet: number
  lineWidthFeet?: number
  saveAbility: AbilityKey
}

export interface RaceDefinition {
  id: string
  name: string
  speedFeet: number
  abilityScoreIncrease: Partial<Record<AbilityKey, number>>
  languages: string[]
  features: RuleFeature[]
  needsAncestry?: boolean
  ancestries?: DragonAncestry[]
}

export interface BreathWeaponInfo {
  damageType: string
  area: string
  save: string
  saveDc: number
  damage: string
  dice: number
  dieSize: number
  uses: string
  recharge: string
  breakdownLines: string[]
}
