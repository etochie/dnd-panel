import type { AbilityKey } from '../types/character'

export interface RacialAbilityBonus {
  match: string[]
  bonuses: Partial<Record<AbilityKey, number>>
  label: string
}

/** Расовые бонусы характеристик из PHB 2014. Другие расы появятся, когда будут данные. */
export const RACIAL_ABILITY_BONUSES_2014: RacialAbilityBonus[] = [
  {
    match: ['драконорожденный', 'dragonborn'],
    bonuses: { str: 2, cha: 1 },
    label: 'Драконорожденный: +2 сила, +1 харизма',
  },
]

export function racialAbilityBonusesFor(race: string): RacialAbilityBonus | null {
  const key = race.trim().toLowerCase()
  if (!key) return null
  return RACIAL_ABILITY_BONUSES_2014.find((entry) => entry.match.includes(key)) ?? null
}
