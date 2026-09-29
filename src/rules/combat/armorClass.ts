import type { Character, InventoryItem } from '../../types/character'
import type { CalculationBreakdown } from '../../types/explain'
import { findCatalogEntryByName } from '../../data/equipmentCatalog'
import { calculateAbilityModifier, formatModifier } from '../core/abilities'
import { resolveAbilityScores } from '../generation/resolveAbilities'
import { getGrantedProficiencies } from '../classes'
import { itemInSlot, normalizeInventory } from './equipment'

export type AcFeatureId =
  | 'barbarian_unarmored'
  | 'monk_unarmored'
  | 'draconic_resilience'
  | 'defense_fighting_style'
  | 'mage_armor'

export interface ArmorClassResult {
  ac: number
  acWithoutShield: number
  shieldBonusApplied: number
  shieldEquipped: boolean
  shieldProficient: boolean
  armorName: string | null
  shieldName: string | null
  formulaId: string
  summary: string
  warnings: string[]
  speedPenaltyMeters: number
  breakdown: CalculationBreakdown
}

interface ArmorStats {
  name: string
  base: number
  type: 'light' | 'medium' | 'heavy'
  maxDex: number | null | undefined
  strengthRequirement?: number
}

interface Formula {
  id: string
  basePiece: string
  base: number
  dexText: string
  dexApplied: number | null
  extraPieces: string[]
  extraValues: number[]
  totalBeforeShield: number
  allowsShield: boolean
  detail: string[]
}

const ARMOR_TYPE_LABEL: Record<ArmorStats['type'], string> = {
  light: 'легкой',
  medium: 'средней',
  heavy: 'тяжелой',
}

export function acFeaturesForCharacter(character: Character): AcFeatureId[] {
  const features: AcFeatureId[] = []
  if (character.classId === 'barbarian') features.push('barbarian_unarmored')
  if (character.classId === 'monk') features.push('monk_unarmored')
  if (
    character.classId === 'sorcerer' &&
    (character.subclassId === 'draconic_bloodline' || character.subclassId === 'draconic')
  ) {
    features.push('draconic_resilience')
  }
  return features
}

function proficiencyList(character: Character): Set<string> {
  const granted = getGrantedProficiencies(character.classId, character.subclassId)
  return new Set([...granted.armor, ...character.extraProficiencies.armor])
}

function armorStats(item: InventoryItem): ArmorStats | null {
  if (item.armorBaseAc != null && item.armorType) {
    return {
      name: item.name,
      base: item.armorBaseAc,
      type: item.armorType,
      maxDex: item.armorType === 'heavy' ? null : item.armorMaxDex,
      strengthRequirement: item.strengthRequirement,
    }
  }
  const known = findCatalogEntryByName(item.name)
  if (!known || known.armorBaseAc == null || !known.armorType) return null
  return {
    name: item.name,
    base: known.armorBaseAc,
    type: known.armorType,
    maxDex: known.armorType === 'heavy' ? null : known.armorMaxDex,
    strengthRequirement: known.strengthRequirement,
  }
}

function dexOnArmor(
  dexMod: number,
  stats: ArmorStats,
): { applied: number | null; text: string; detail: string } {
  if (stats.type === 'heavy' || stats.maxDex === null) {
    return {
      applied: null,
      text: 'ловкость не применяется',
      detail: 'Тяжелая броня: модификатор ловкости не добавляется',
    }
  }
  if (stats.type === 'medium') {
    const cap = stats.maxDex ?? 2
    const applied = Math.min(dexMod, cap)
    return {
      applied,
      text: `ловкость ${formatModifier(applied)}`,
      detail: `Средняя броня: модификатор ловкости не выше ${formatModifier(cap)}, учтено ${formatModifier(applied)}`,
    }
  }
  if (typeof stats.maxDex === 'number') {
    const applied = Math.min(dexMod, stats.maxDex)
    return {
      applied,
      text: `ловкость ${formatModifier(applied)}`,
      detail: `Легкая броня: модификатор ловкости не выше ${formatModifier(stats.maxDex)}, учтено ${formatModifier(applied)}`,
    }
  }
  return {
    applied: dexMod,
    text: `ловкость ${formatModifier(dexMod)}`,
    detail: `Легкая броня: добавляется модификатор ловкости ${formatModifier(dexMod)}`,
  }
}

function unarmoredFormula(dexMod: number): Formula {
  return {
    id: 'unarmored',
    basePiece: 'без брони 10',
    base: 10,
    dexText: `ловкость ${formatModifier(dexMod)}`,
    dexApplied: dexMod,
    extraPieces: [],
    extraValues: [],
    totalBeforeShield: 10 + dexMod,
    allowsShield: true,
    detail: ['Без брони: 10 + модификатор ловкости'],
  }
}

function collectFormulas(
  dexMod: number,
  conMod: number,
  wisMod: number,
  armor: ArmorStats | null,
  features: AcFeatureId[],
  shieldEquipped: boolean,
): Formula[] {
  const formulas: Formula[] = []
  if (armor) {
    const dex = dexOnArmor(dexMod, armor)
    const dexPart = dex.applied ?? 0
    formulas.push({
      id: 'armor',
      basePiece: `${armor.name} ${armor.base}`,
      base: armor.base,
      dexText: dex.text,
      dexApplied: dex.applied,
      extraPieces: [],
      extraValues: [],
      totalBeforeShield: armor.base + dexPart,
      allowsShield: true,
      detail: [`Броня: ${armor.name}, база ${armor.base}`, dex.detail],
    })
  }

  formulas.push(unarmoredFormula(dexMod))

  if (!armor && features.includes('barbarian_unarmored')) {
    formulas.push({
      id: 'barbarian_unarmored',
      basePiece: 'защита без доспехов 10',
      base: 10,
      dexText: `ловкость ${formatModifier(dexMod)}`,
      dexApplied: dexMod,
      extraPieces: [`телосложение ${formatModifier(conMod)}`],
      extraValues: [conMod],
      totalBeforeShield: 10 + dexMod + conMod,
      allowsShield: true,
      detail: [
        'Защита без доспехов варвара: 10 + ловкость + телосложение',
        'В броне эта формула не используется',
      ],
    })
  }

  if (!armor && !shieldEquipped && features.includes('monk_unarmored')) {
    formulas.push({
      id: 'monk_unarmored',
      basePiece: 'защита без доспехов 10',
      base: 10,
      dexText: `ловкость ${formatModifier(dexMod)}`,
      dexApplied: dexMod,
      extraPieces: [`мудрость ${formatModifier(wisMod)}`],
      extraValues: [wisMod],
      totalBeforeShield: 10 + dexMod + wisMod,
      allowsShield: false,
      detail: [
        'Защита без доспехов монаха: 10 + ловкость + мудрость',
        'Формула не действует в броне и со щитом',
      ],
    })
  }

  if (!armor && features.includes('draconic_resilience')) {
    formulas.push({
      id: 'draconic_resilience',
      basePiece: 'драконья устойчивость 13',
      base: 13,
      dexText: `ловкость ${formatModifier(dexMod)}`,
      dexApplied: dexMod,
      extraPieces: [],
      extraValues: [],
      totalBeforeShield: 13 + dexMod,
      allowsShield: true,
      detail: ['Драконья устойчивость: 13 + модификатор ловкости, пока не надета броня'],
    })
  }

  if (!armor && features.includes('mage_armor')) {
    formulas.push({
      id: 'mage_armor',
      basePiece: 'доспех мага 13',
      base: 13,
      dexText: `ловкость ${formatModifier(dexMod)}`,
      dexApplied: dexMod,
      extraPieces: [],
      extraValues: [],
      totalBeforeShield: 13 + dexMod,
      allowsShield: true,
      detail: ['Доспех мага: 13 + модификатор ловкости. С обычной броней не сочетается'],
    })
  }

  return formulas
}

function chooseFormula(formulas: Formula[], wearingArmor: boolean): Formula {
  if (wearingArmor) {
    return formulas.find((formula) => formula.id === 'armor') ?? formulas[0]
  }
  const alternates = formulas.filter((formula) => formula.id !== 'armor' && formula.id !== 'unarmored')
  if (alternates.length === 0) {
    return formulas.find((formula) => formula.id === 'unarmored') ?? formulas[0]
  }
  return alternates.reduce((best, formula) =>
    formula.totalBeforeShield > best.totalBeforeShield ? formula : best,
  )
}

function signedTerm(value: number): string {
  return value < 0 ? `(${value})` : String(value)
}

export function calculateArmorClass(
  character: Character,
  featureOverride?: AcFeatureId[],
): ArmorClassResult {
  const scores = resolveAbilityScores(character).scores
  const dexMod = calculateAbilityModifier(scores.dex)
  const conMod = calculateAbilityModifier(scores.con)
  const wisMod = calculateAbilityModifier(scores.wis)
  const features = featureOverride ?? acFeaturesForCharacter(character)
  const inventory = normalizeInventory(character.inventory)
  const armorItem = itemInSlot(inventory, 'armor')
  const shieldItem = itemInSlot(inventory, 'shield')
  const stats = armorItem ? armorStats(armorItem) : null
  const shieldEquipped = Boolean(shieldItem)
  const formulas = collectFormulas(dexMod, conMod, wisMod, stats, features, shieldEquipped)
  const formula = chooseFormula(formulas, Boolean(stats))
  const rawShield = shieldItem ? (shieldItem.shieldBonus ?? 2) : 0
  const shieldBonusApplied = shieldEquipped && formula.allowsShield ? rawShield : 0

  let other = 0
  const otherLines: string[] = []
  for (const item of inventory) {
    if (!item.equipped || !item.acBonus) continue
    other += item.acBonus
    otherLines.push(`${item.name}: ${formatModifier(item.acBonus)}`)
  }
  if (features.includes('defense_fighting_style') && stats) {
    other += 1
    otherLines.push('Оборонительный стиль боя: +1, пока надета броня')
  }
  if (character.concentration?.spellId === 'shield_of_faith') {
    other += 2
    otherLines.push('Щит веры: +2, пока держится концентрация')
  }

  const acWithoutShield = formula.totalBeforeShield + other
  const ac = acWithoutShield + shieldBonusApplied
  const summary = `${ac} = ${[formula.basePiece, formula.dexText, ...formula.extraPieces, `щит ${formatModifier(shieldBonusApplied)}`, `прочее ${formatModifier(other)}`].join(' + ')}`

  const warnings: string[] = []
  const proficient = proficiencyList(character)
  if (stats && !proficient.has(stats.type)) {
    warnings.push(
      `Нет владения ${ARMOR_TYPE_LABEL[stats.type]} броней. КД считается по надетой броне. Проверки, спасброски и атаки Силы и Ловкости идут с помехой, заклинания накладывать нельзя.`,
    )
  }
  if (shieldEquipped && !proficient.has('shield')) {
    warnings.push(
      'Нет владения щитами. Бонус щита к КД все равно учитывается. Проверки, спасброски и атаки Силы и Ловкости идут с помехой, заклинания накладывать нельзя.',
    )
  }
  if (armorItem && !stats) {
    warnings.push('У надетой брони не задана база КД, поэтому используется формула без брони.')
  }
  let speedPenaltyMeters = 0
  if (stats?.strengthRequirement && scores.str < stats.strengthRequirement) {
    speedPenaltyMeters = 3
    warnings.push(
      `Для ${stats.name} нужна Сила ${stats.strengthRequirement}. Сейчас Сила ${scores.str}, поэтому скорость меньше на 3 м. КД не снижается.`,
    )
  }
  if (features.includes('monk_unarmored') && shieldEquipped && !stats) {
    warnings.push('Защита без доспехов монаха не действует, пока надет щит.')
  }

  const alternateIds = formulas
    .map((entry) => entry.id)
    .filter((id) => id !== 'armor' && id !== 'unarmored')
  const lines = [...formula.detail]
  if (stats && features.some((feature) => feature !== 'defense_fighting_style')) {
    lines.push('Пока надета броня, другие формулы КД не добавляются и не заменяют броню.')
  } else if (!stats && alternateIds.length > 1) {
    lines.push('Формулы без брони не складываются. Выбрана та, что дает больший КД.')
  }
  if (shieldEquipped) {
    lines.push(`Щит: ${shieldItem?.name ?? 'щит'} ${formatModifier(shieldBonusApplied)}`)
  } else {
    lines.push('Щит не надет')
  }
  if (otherLines.length > 0) {
    lines.push(...otherLines)
    lines.push(`Прочее: ${formatModifier(other)}`)
  } else {
    lines.push('Прочее: +0')
  }

  const arithmetic = [
    signedTerm(formula.base),
    ...(formula.dexApplied == null ? [] : [signedTerm(formula.dexApplied)]),
    ...formula.extraValues.map(signedTerm),
    signedTerm(shieldBonusApplied),
    signedTerm(other),
  ].join(' + ')
  lines.push(`Итог: ${arithmetic} = ${ac}`)
  for (const warning of warnings) lines.push(warning)

  return {
    ac,
    acWithoutShield,
    shieldBonusApplied,
    shieldEquipped,
    shieldProficient: proficient.has('shield'),
    armorName: armorItem?.name ?? null,
    shieldName: shieldItem?.name ?? null,
    formulaId: formula.id,
    summary,
    warnings,
    speedPenaltyMeters,
    breakdown: {
      title: 'Класс брони',
      result: summary,
      lines,
    },
  }
}

export function calculateInitiative(character: Character): {
  value: number
  breakdown: CalculationBreakdown
} {
  const dexMod = calculateAbilityModifier(resolveAbilityScores(character).scores.dex)
  return {
    value: dexMod,
    breakdown: {
      title: 'Инициатива',
      result: formatModifier(dexMod),
      lines: ['Инициатива = модификатор ловкости', formatModifier(dexMod)],
    },
  }
}

export function calculatePassivePerception(skillBonus: number): CalculationBreakdown {
  const passive = 10 + skillBonus
  return {
    title: 'Пассивное восприятие',
    result: String(passive),
    lines: [
      '10 + бонус навыка "Внимательность"',
      `10 + ${skillBonus >= 0 ? skillBonus : `(${skillBonus})`} = ${passive}`,
    ],
  }
}
