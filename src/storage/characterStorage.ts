import type { AppStorage, Character } from '../types/character'
import { createTestCleric } from '../data/testCharacter'
import { migrateCharacter } from './migrateCharacter'

const STORAGE_KEY = 'dnd-panel-characters-v2'

function emptyStorage(): AppStorage {
  const test = createTestCleric()
  return {
    version: 2,
    characters: [test],
    activeCharacterId: test.id,
  }
}

export function loadStorage(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStorage()
    const parsed = JSON.parse(raw) as { version?: number; characters?: unknown[]; activeCharacterId?: string | null }
    if (!Array.isArray(parsed.characters)) {
      throw new Error('Несовместимый формат сохранения')
    }
    const characters = parsed.characters.map((item) => migrateCharacter(item))
    const activeCharacterId =
      characters.find((item) => item.id === parsed.activeCharacterId)?.id ?? characters[0]?.id ?? null
    return { version: 2, characters, activeCharacterId }
  } catch {
    return emptyStorage()
  }
}

export function saveStorage(data: AppStorage): void {
  try {
    const payload: AppStorage = {
      version: 2,
      characters: data.characters,
      activeCharacterId: data.activeCharacterId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // На телефоне в приватном режиме запись может быть запрещена.
  }
}

export function exportCharacterJson(character: Character): string {
  return JSON.stringify(character, null, 2)
}

export function importCharacterJson(raw: string): Character {
  const parsed = JSON.parse(raw)
  const character = migrateCharacter(parsed)
  if (!character.id || !character.name || typeof character.level !== 'number') {
    throw new Error('Файл не похож на персонажа этого приложения')
  }
  return character
}

export function resetAllData(): AppStorage {
  localStorage.removeItem(STORAGE_KEY)
  const data = emptyStorage()
  saveStorage(data)
  return data
}
