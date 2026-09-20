import type { Character } from '../types/character'
import { calculateRulesMaxHp, getSpellSlots } from '../rules'
import { createId } from '../utils/id'
import { emptyJournal, emptyProficiencies } from '../storage/migrateCharacter'

export function createTestCleric(): Character {
  const now = new Date().toISOString()
  const level = 3
  const maceId = createId()
  const character: Character = {
    id: createId(),
    name: 'Тестовый жрец',
    raceId: 'dragonborn',
    ancestryId: 'silver',
    classId: 'cleric',
    subclassId: 'death_domain',
    level,
    background: '',
    alignment: '',
    notes: '',
    abilityGenerationMethod: 'manual',
    baseAbilities: {
      str: 12,
      dex: 10,
      con: 10,
      int: 10,
      wis: 18,
      cha: 9,
    },
    asiChoices: [],
    allowFeats: true,
    hpCalculationMethod: 'fixed',
    hpRolls: {},
    skillProficiencies: [],
    skillExpertise: [],
    extraSaveProficiencies: [],
    extraProficiencies: emptyProficiencies(),
    knownSpellIds: [],
    preparedSpellIds: [],
    cantripIds: [],
    spellSlots: getSpellSlots('cleric', level),
    currentHp: 18,
    tempHp: 0,
    hitDiceRemaining: 3,
    resources: [],
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
    journal: emptyJournal(),
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: 9,
    },
    concentration: null,
    overrides: {},
    createdAt: now,
    updatedAt: now,
  }
  character.currentHp = calculateRulesMaxHp(character).value
  return character
}

export function createBlankCharacter(name: string): Character {
  const now = new Date().toISOString()
  const character: Character = {
    id: createId(),
    name,
    raceId: 'dragonborn',
    ancestryId: 'silver',
    classId: 'cleric',
    subclassId: 'death_domain',
    level: 1,
    background: '',
    alignment: '',
    notes: '',
    abilityGenerationMethod: 'point_buy',
    baseAbilities: {
      str: 8,
      dex: 8,
      con: 8,
      int: 8,
      wis: 8,
      cha: 8,
    },
    asiChoices: [],
    allowFeats: true,
    hpCalculationMethod: 'fixed',
    hpRolls: {},
    skillProficiencies: [],
    skillExpertise: [],
    extraSaveProficiencies: [],
    extraProficiencies: emptyProficiencies(),
    knownSpellIds: [],
    preparedSpellIds: [],
    cantripIds: [],
    spellSlots: getSpellSlots('cleric', 1),
    currentHp: 1,
    tempHp: 0,
    hitDiceRemaining: 1,
    resources: [],
    inventory: [],
    conditions: [],
    journal: emptyJournal(),
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    combat: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementRemaining: 9,
    },
    concentration: null,
    overrides: {},
    createdAt: now,
    updatedAt: now,
  }
  character.currentHp = calculateRulesMaxHp(character).value
  return character
}
