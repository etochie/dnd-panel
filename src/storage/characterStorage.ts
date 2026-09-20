import type { AppStorage, Character } from '../types/character'
import { createTestCleric } from '../data/testCharacter'

const STORAGE_KEY = 'dnd-panel-characters-v1'

export function loadStorage(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const test = createTestCleric()
      return {
        version: 1,
        characters: [test],
        activeCharacterId: test.id,
      }
    }
    const parsed = JSON.parse(raw) as AppStorage
    if (parsed.version !== 1 || !Array.isArray(parsed.characters)) {
      throw new Error('Несовместимый формат сохранения')
    }
    return parsed
  } catch {
    const test = createTestCleric()
    return {
      version: 1,
      characters: [test],
      activeCharacterId: test.id,
    }
  }
}

export function saveStorage(data: AppStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // На телефоне в приватном режиме запись может быть запрещена.
  }
}

export function exportCharacterJson(character: Character): string {
  return JSON.stringify(character, null, 2)
}

export function importCharacterJson(raw: string): Character {
  const parsed = JSON.parse(raw) as Character
  if (!parsed.id || !parsed.name || typeof parsed.level !== 'number') {
    throw new Error('Файл не похож на персонажа этого приложения')
  }
  return parsed
}

export function resetAllData(): AppStorage {
  localStorage.removeItem(STORAGE_KEY)
  const test = createTestCleric()
  const data: AppStorage = {
    version: 1,
    characters: [test],
    activeCharacterId: test.id,
  }
  saveStorage(data)
  return data
}
