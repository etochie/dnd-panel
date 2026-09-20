import { feetToMeters } from '../../data/distances'
import { DRAGONBORN_RACE, getDragonbornAncestry, getDragonbornBreath } from './dragonborn'
import type { RaceDefinition } from './types'

export type { BreathWeaponInfo, DragonAncestry, RaceDefinition } from './types'
export {
  DRAGONBORN_ANCESTRIES,
  DRAGONBORN_RACE,
  ancestryIdFromLegacy,
  breathDiceCount,
} from './dragonborn'

export const RACES: RaceDefinition[] = [DRAGONBORN_RACE]

export function getRaceDefinition(raceId: string | undefined): RaceDefinition | undefined {
  if (!raceId) return undefined
  return RACES.find((item) => item.id === raceId)
}

export function raceIdFromLegacyName(name: string | undefined): string | undefined {
  if (!name) return undefined
  const key = name.trim().toLowerCase()
  if (['драконорожденный', 'dragonborn'].includes(key)) return 'dragonborn'
  return RACES.find((item) => item.name.toLowerCase() === key)?.id
}

export function getRacialAbilityBonuses(raceId: string | undefined): Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>> {
  return getRaceDefinition(raceId)?.abilityScoreIncrease ?? {}
}

export function getRaceSpeedFeet(raceId: string | undefined): number {
  return getRaceDefinition(raceId)?.speedFeet ?? 30
}

export function getRaceSpeedMeters(raceId: string | undefined): number {
  const feet = getRaceSpeedFeet(raceId)
  return (feet / 5) * 1.5
}

export function formatRaceSpeed(raceId: string | undefined): string {
  return feetToMeters(getRaceSpeedFeet(raceId))
}

export function getRacialFeatures(raceId: string | undefined, level: number) {
  return (getRaceDefinition(raceId)?.features ?? []).filter((feature) => feature.level <= level)
}

export function getRaceLanguages(raceId: string | undefined): string[] {
  return getRaceDefinition(raceId)?.languages ?? []
}

export { getDragonbornAncestry, getDragonbornBreath }
