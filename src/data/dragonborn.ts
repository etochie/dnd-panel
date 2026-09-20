import { feetToMeters } from './distances'

export interface BreathWeaponInfo {
  damageType: string
  area: string
  save: string
  damage: string
  uses: string
  recharge: string
  unknownParts?: string[]
}

/** Серебряный дракон: холод, конус 4,5 м (15 ft), спасбросок CON, урон 2d6 на 3 уровне по SRD 2014 */
export function getDragonbornBreath(
  level: number,
  breathType: string,
): BreathWeaponInfo {
  const damageDice = level >= 6 ? '3d6' : level >= 3 ? '2d6' : '1d6'
  return {
    damageType: breathType,
    area: `конус ${feetToMeters(15)}`,
    save: 'Телосложение',
    damage: `${damageDice} ${breathType}`,
    uses: '1',
    recharge: 'короткий или продолжительный отдых (дыхание драконорожденного 2014)',
    unknownParts:
      breathType !== 'холод'
        ? ['Точные параметры для выбранного типа дыхания не загружены.']
        : undefined,
  }
}
