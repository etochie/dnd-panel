import type { Character } from '../types/character'
import { buildSpellSlotsForCleric } from './classes'
import { domainSpellIdsForLevel } from './deathDomain'
import { createId } from '../utils/id'
import { calculateRulesMaxHp } from '../engine/hitPoints'

export function createTestCleric(): Character {
  const now = new Date().toISOString()
  const level = 3
  const maceId = createId()
  const slots = buildSpellSlotsForCleric(level)
  const domainIds = domainSpellIdsForLevel(level)

  return {
    id: createId(),
    name: 'Тестовый жрец',
    race: 'Драконорожденный',
    raceDetails: {
      dragonbornLineage: 'Серебряный дракон',
      breathType: 'холод',
    },
    classId: 'cleric',
    subclassId: 'death_domain',
    level,
    background: '',
    alignment: '',
    notes: '',
    abilities: {
      str: 14,
      dex: 10,
      con: 10,
      int: 10,
      wis: 18,
      cha: 10,
    },
    skillProficiencies: [],
    skillExpertise: [],
    saveProficiencies: ['wis', 'cha'],
    proficiencies: {
      armor: ['light', 'medium', 'shield'],
      weapons: ['simple'],
      tools: [],
      languages: ['common'],
      other: [],
    },
    knownSpellIds: [],
    preparedSpellIds: [],
    cantripIds: [],
    domainSpellIds: domainIds,
    spellSlots: slots.map((s) => ({
      ...s,
      current: s.level === 1 ? 3 : s.current,
    })),
    currentHp: 24,
    maxHpOverride: 27,
    tempHp: 0,
    hitDiceRemaining: 3,
    hitDieSize: 8,
    resources: [
      {
        id: 'channel_divinity',
        name: 'Божественный канал',
        current: 1,
        max: 1,
        recharge: 'short_rest',
        description: 'На 2 уровне жреца - 1 использование, на 6 - 2 (2014).',
      },
      {
        id: 'breath_weapon',
        name: 'Драконье дыхание',
        current: 1,
        max: 1,
        recharge: 'short_rest',
        description: 'Дыхание драконорожденного по правилам 2014.',
      },
    ],
    inventory: [
      {
        id: maceId,
        name: 'Булава',
        quantity: 1,
        weight: 2,
        cost: '5 зм',
        description: 'Простое рукопашное оружие.',
        equipped: true,
        category: 'weapon',
        weaponDamage: '1d6',
        weaponDamageType: 'дробящего',
        weaponProperties: [],
      },
    ],
    conditions: [],
    journal: {
      npcs: [],
      facts: '',
      quests: [],
      locations: [],
      generalNotes: '',
    },
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    speedOverride: 9,
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: 9,
    },
    concentration: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function createBlankCharacter(name: string): Character {
  const now = new Date().toISOString()
  const level = 1
  const character: Character = {
    id: createId(),
    name,
    race: '',
    classId: 'cleric',
    level,
    background: '',
    alignment: '',
    notes: '',
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    skillProficiencies: [],
    skillExpertise: [],
    saveProficiencies: [],
    proficiencies: {
      armor: [],
      weapons: [],
      tools: [],
      languages: [],
      other: [],
    },
    knownSpellIds: [],
    preparedSpellIds: [],
    cantripIds: [],
    domainSpellIds: [],
    spellSlots: buildSpellSlotsForCleric(level),
    currentHp: 1,
    maxHpOverride: null,
    tempHp: 0,
    hitDiceRemaining: 1,
    hitDieSize: 8,
    resources: [],
    inventory: [],
    conditions: [],
    journal: {
      npcs: [],
      facts: '',
      quests: [],
      locations: [],
      generalNotes: '',
    },
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    speedOverride: null,
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: 9,
    },
    concentration: null,
    createdAt: now,
    updatedAt: now,
  }
  character.currentHp = calculateRulesMaxHp(character).value
  return character
}
