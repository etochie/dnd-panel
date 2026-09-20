import type {
  AbilityGenerationMethod,
  AbilityKey,
  AsiChoice,
  HpCalculationMethod,
  ManualOverrides,
} from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'

export type {
  AbilityGenerationMethod,
  AbilityKey,
  AsiChoice,
  CalculationBreakdown,
  HpCalculationMethod,
  ManualOverrides,
}

export type ActionEconomy = 'action' | 'bonus' | 'reaction' | 'movement' | 'free' | 'passive'

export interface RuleFeature {
  id: string
  name: string
  level: number
  description: string
  usage?: string
  actionType?: ActionEconomy | string
  limits?: string
  resourceId?: string
}

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const EMPTY_ABILITIES: Record<AbilityKey, number> = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
}
