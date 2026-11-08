import type { Character } from '../../types/character'

export function characterAfterDamage(character: Character, amount: number): Character {
  let temp = character.tempHp
  let hp = character.currentHp
  let remaining = amount
  if (temp > 0) {
    const used = Math.min(temp, remaining)
    temp -= used
    remaining -= used
  }
  return { ...character, currentHp: Math.max(0, hp - remaining), tempHp: temp }
}

export function characterAfterHeal(character: Character, amount: number, maxHp: number): Character {
  return { ...character, currentHp: Math.min(maxHp, character.currentHp + amount) }
}

export function characterAfterTempHp(character: Character, amount: number): Character {
  return { ...character, tempHp: character.tempHp + amount }
}
