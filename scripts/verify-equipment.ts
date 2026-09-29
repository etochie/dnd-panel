import assert from 'node:assert/strict'
import { createCatalogItem } from '../src/data/equipmentCatalog'
import { createTestCleric } from '../src/data/testCharacter'
import { calculateArmorClass, type AcFeatureId } from '../src/rules/combat/armorClass'
import {
  equipInventoryItem,
  normalizeInventory,
  unequipInventoryItem,
} from '../src/rules/combat/equipment'
import { deriveCharacterStats } from '../src/rules/derive'
import { migrateCharacter } from '../src/storage/migrateCharacter'
import type { Character, InventoryItem } from '../src/types/character'

function must<T>(value: T | null | undefined, label: string): T {
  assert.ok(value, label)
  return value
}

function withDex(dex: number, items: InventoryItem[], str = 12): Character {
  const character = createTestCleric()
  character.baseAbilities = { ...character.baseAbilities, dex, str }
  character.inventory = normalizeInventory([...character.inventory, ...items])
  return character
}

function catalog(id: string): InventoryItem {
  return must(createCatalogItem(id), id)
}

function equip(character: Character, name: string): Character {
  const item = must(
    character.inventory.find((entry) => entry.name === name && !entry.equipped) ??
      character.inventory.find((entry) => entry.name === name),
    name,
  )
  const result = equipInventoryItem(character.inventory, item.id)
  return { ...character, inventory: result.items }
}

function unequip(character: Character, name: string): Character {
  const item = must(
    character.inventory.find((entry) => entry.name === name),
    name,
  )
  return { ...character, inventory: unequipInventoryItem(character.inventory, item.id) }
}

function equippedNames(character: Character): string[] {
  return character.inventory.filter((item) => item.equipped).map((item) => item.name).sort()
}

function acOf(character: Character, features?: AcFeatureId[]) {
  return calculateArmorClass(character, features)
}

const checks: string[] = []

function check(name: string, run: () => void) {
  run()
  checks.push(name)
}

check('кольчуга при ловкости 8 дает КД 16', () => {
  const chain = catalog('chain_mail')
  const character = equip(withDex(8, [chain]), 'Кольчуга')
  const ac = acOf(character)
  assert.equal(ac.ac, 16)
  assert.equal(ac.formulaId, 'armor')
  assert.ok(ac.summary.includes('ловкость не применяется'))
  assert.ok(equippedNames(character).includes('Кольчуга'))
})

check('щит добавляется к кольчуге и дает КД 18', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield')])
  const before = character.inventory.length
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  const ac = acOf(character)
  assert.equal(ac.ac, 18)
  assert.equal(ac.shieldBonusApplied, 2)
  assert.deepEqual(equippedNames(character).filter((name) => name !== 'Булава'), ['Кольчуга', 'Щит'].sort())
  assert.equal(character.inventory.length, before)
})

check('снятие щита возвращает КД 16 и не удаляет предметы', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield')])
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  const before = character.inventory.length
  character = unequip(character, 'Щит')
  assert.equal(acOf(character).ac, 16)
  assert.equal(character.inventory.find((item) => item.name === 'Щит')?.equipped, false)
  assert.equal(character.inventory.find((item) => item.name === 'Кольчуга')?.equipped, true)
  assert.equal(character.inventory.length, before)
})

check('латы заменяют только броню и дают КД 18', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield'), catalog('plate')])
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  character = unequip(character, 'Щит')
  const before = character.inventory.length
  character = equip(character, 'Латы')
  assert.equal(acOf(character).ac, 18)
  assert.equal(character.inventory.find((item) => item.name === 'Кольчуга')?.equipped, false)
  assert.equal(character.inventory.find((item) => item.name === 'Латы')?.equipped, true)
  assert.equal(character.inventory.find((item) => item.name === 'Щит')?.equipped, false)
  assert.equal(character.inventory.length, before)
})

check('щит поверх лат дает КД 20', () => {
  let character = withDex(8, [catalog('plate'), catalog('shield')])
  character = equip(character, 'Латы')
  character = equip(character, 'Щит')
  assert.equal(acOf(character).ac, 20)
  assert.deepEqual(
    equippedNames(character).filter((name) => name !== 'Булава'),
    ['Латы', 'Щит'].sort(),
  )
})

check('смена брони пересчитывает КД и оставляет щит', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('plate'), catalog('shield')])
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  assert.equal(acOf(character).ac, 18)
  character = equip(character, 'Латы')
  assert.equal(acOf(character).ac, 20)
  assert.equal(character.inventory.find((item) => item.name === 'Щит')?.equipped, true)
  assert.equal(character.inventory.find((item) => item.name === 'Кольчуга')?.equipped, false)
})

check('ловкость зависит от типа брони', () => {
  const leather = (dex: number) =>
    acOf(equip(withDex(dex, [catalog('leather')]), 'Кожаный доспех')).ac
  const scale = (dex: number) =>
    acOf(equip(withDex(dex, [catalog('scale')]), 'Чешуйчатый доспех')).ac
  const chain = (dex: number) =>
    acOf(equip(withDex(dex, [catalog('chain_mail')]), 'Кольчуга')).ac
  assert.equal(leather(8), 10)
  assert.equal(leather(14), 13)
  assert.equal(scale(8), 13)
  assert.equal(scale(16), 16)
  assert.equal(chain(8), 16)
  assert.equal(chain(18), 16)
})

check('после загрузки экипировка и КД те же', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield')])
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  const beforeIds = character.inventory.map((item) => item.id)
  const loaded = migrateCharacter(JSON.parse(JSON.stringify(character)))
  assert.equal(acOf(loaded).ac, 18)
  assert.equal(loaded.inventory.find((item) => item.name === 'Кольчуга')?.equipped, true)
  assert.equal(loaded.inventory.find((item) => item.name === 'Щит')?.equipped, true)
  assert.deepEqual(
    loaded.inventory.map((item) => item.id),
    beforeIds,
  )
})

check('кольчуга, щит и меч остаются вместе', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield'), catalog('longsword')])
  character = unequip(character, 'Булава')
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  character = equip(character, 'Длинный меч')
  assert.equal(acOf(character).ac, 18)
  for (const name of ['Кольчуга', 'Щит', 'Длинный меч']) {
    assert.equal(character.inventory.find((item) => item.name === name)?.equipped, true, name)
  }
  assert.equal(character.inventory.find((item) => item.name === 'Булава')?.equipped, false)
})

check('двуручный меч снимает щит, но не броню', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield'), catalog('greatsword')])
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  const result = equipInventoryItem(
    character.inventory,
    must(character.inventory.find((item) => item.name === 'Двуручный меч'), 'меч').id,
  )
  character = { ...character, inventory: result.items }
  assert.equal(character.inventory.find((item) => item.name === 'Кольчуга')?.equipped, true)
  assert.equal(character.inventory.find((item) => item.name === 'Щит')?.equipped, false)
  assert.equal(character.inventory.find((item) => item.name === 'Двуручный меч')?.equipped, true)
  assert.ok(result.replacedNames.includes('Щит'))
  assert.equal(acOf(character).ac, 16)
})

check('предметы не пропадают и не дублируются', () => {
  let character = withDex(8, [catalog('chain_mail'), catalog('shield'), catalog('plate')])
  const ids = character.inventory.map((item) => item.id)
  character = equip(character, 'Кольчуга')
  character = equip(character, 'Щит')
  character = unequip(character, 'Щит')
  character = equip(character, 'Латы')
  character = equip(character, 'Щит')
  assert.equal(character.inventory.length, ids.length)
  assert.deepEqual(
    character.inventory.map((item) => item.id).sort(),
    [...ids].sort(),
  )
})

check('формулы КД не складываются', () => {
  const naked = withDex(14, [], 14)
  naked.baseAbilities = { ...naked.baseAbilities, con: 14 }
  const barbarian = acOf(naked, ['barbarian_unarmored'])
  assert.equal(barbarian.ac, 14)
  assert.equal(barbarian.formulaId, 'barbarian_unarmored')

  const armored = acOf(equip(withDex(14, [catalog('chain_mail')], 14), 'Кольчуга'), [
    'barbarian_unarmored',
  ])
  assert.equal(armored.ac, 16)
  assert.equal(armored.formulaId, 'armor')

  const monkCharacter = withDex(16, [])
  monkCharacter.baseAbilities = { ...monkCharacter.baseAbilities, wis: 16 }
  const monk = acOf(monkCharacter, ['monk_unarmored'])
  assert.equal(monk.ac, 16)
  const monkShield = acOf(equip(withDex(16, [catalog('shield')]), 'Щит'), ['monk_unarmored'])
  assert.equal(monkShield.ac, 15)
  assert.equal(monkShield.formulaId, 'unarmored')

  const both = withDex(14, [], 14)
  both.baseAbilities = { ...both.baseAbilities, con: 14 }
  const picked = acOf(both, ['draconic_resilience', 'barbarian_unarmored'])
  assert.equal(picked.ac, 15)
  assert.equal(picked.formulaId, 'draconic_resilience')
})

check('магический бонус и оборонительный стиль идут в прочее', () => {
  const chain = catalog('chain_mail')
  chain.acBonus = 1
  const character = equip(withDex(8, [chain, catalog('shield')]), 'Кольчуга')
  const worn = equip(character, 'Щит')
  const plain = acOf(worn)
  assert.equal(plain.ac, 19)
  const defense = acOf(worn, ['defense_fighting_style'])
  assert.equal(defense.ac, 20)
  const unarmoredDefense = acOf(withDex(8, []), ['defense_fighting_style'])
  assert.equal(unarmoredDefense.ac, 9)
})

check('нехватка Силы снижает скорость, но не КД', () => {
  const character = equip(withDex(8, [catalog('chain_mail')], 8), 'Кольчуга')
  assert.equal(acOf(character).ac, 16)
  const derived = deriveCharacterStats(character)
  assert.equal(derived.speed, 6)
  const manual = deriveCharacterStats({
    ...character,
    overrides: { speed: 9 },
  })
  assert.equal(manual.speed, 9)
})

console.log(checks.map((name) => `ok: ${name}`).join('\n'))
