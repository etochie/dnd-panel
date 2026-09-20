import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Character } from '../types/character'
import { deriveCharacterStats, effectiveMaxHp, syncCharacterRuntime } from '../rules'
import {
  exportCharacterJson,
  importCharacterJson,
  loadStorage,
  resetAllData,
  saveStorage,
} from '../storage/characterStorage'
import { createBlankCharacter } from '../data/testCharacter'
import { createId } from '../utils/id'

interface CharacterContextValue {
  characters: Character[]
  activeCharacter: Character
  derived: ReturnType<typeof deriveCharacterStats>
  setActiveCharacterId: (id: string) => void
  updateActiveCharacter: (patch: Partial<Character> | ((c: Character) => Character)) => void
  createCharacter: (character: Character) => void
  deleteCharacter: (id: string) => void
  exportActive: () => void
  importCharacter: (json: string) => void
  resetData: () => void
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

function touch(character: Character): Character {
  return { ...character, updatedAt: new Date().toISOString() }
}

function normalize(character: Character): Character {
  const synced = syncCharacterRuntime(character)
  const maxHp = effectiveMaxHp(synced)
  if (synced.currentHp > maxHp) {
    return { ...synced, currentHp: maxHp }
  }
  return synced
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState(() => loadStorage())

  useEffect(() => {
    saveStorage(storage)
  }, [storage])

  const activeCharacter = useMemo(() => {
    const found = storage.characters.find((item) => item.id === storage.activeCharacterId)
    const raw = found ?? storage.characters[0] ?? createBlankCharacter('Новый персонаж')
    return normalize(raw)
  }, [storage])

  const derived = useMemo(() => deriveCharacterStats(activeCharacter), [activeCharacter])

  const setActiveCharacterId = useCallback((id: string) => {
    setStorage((state) => ({ ...state, activeCharacterId: id }))
  }, [])

  const updateActiveCharacter = useCallback(
    (patch: Partial<Character> | ((c: Character) => Character)) => {
      setStorage((state) => {
        const idx = state.characters.findIndex((item) => item.id === state.activeCharacterId)
        if (idx < 0) return state
        const current = state.characters[idx]
        const next = normalize(
          touch(typeof patch === 'function' ? patch(current) : { ...current, ...patch }),
        )
        const characters = [...state.characters]
        characters[idx] = next
        return { ...state, characters }
      })
    },
    [],
  )

  const createCharacter = useCallback((character: Character) => {
    const created = normalize({
      ...character,
      id: character.id || createId(),
      createdAt: character.createdAt || new Date().toISOString(),
    })
    setStorage((state) => ({
      ...state,
      characters: [...state.characters, created],
      activeCharacterId: created.id,
    }))
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setStorage((state) => {
      const characters = state.characters.filter((item) => item.id !== id)
      if (characters.length === 0) {
        const blank = normalize(createBlankCharacter('Новый персонаж'))
        return { ...state, characters: [blank], activeCharacterId: blank.id }
      }
      const activeCharacterId =
        state.activeCharacterId === id ? characters[0].id : state.activeCharacterId
      return { ...state, characters, activeCharacterId }
    })
  }, [])

  const exportActive = useCallback(() => {
    const json = exportCharacterJson(activeCharacter)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeCharacter.name || 'персонаж'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeCharacter])

  const importCharacter = useCallback((json: string) => {
    const imported = normalize({ ...importCharacterJson(json), id: createId() })
    setStorage((state) => ({
      ...state,
      characters: [...state.characters, imported],
      activeCharacterId: imported.id,
    }))
  }, [])

  const resetData = useCallback(() => {
    setStorage(resetAllData())
  }, [])

  const value: CharacterContextValue = {
    characters: storage.characters,
    activeCharacter,
    derived,
    setActiveCharacterId,
    updateActiveCharacter,
    createCharacter,
    deleteCharacter,
    exportActive,
    importCharacter,
    resetData,
  }

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
}

export function useCharacterStore(): CharacterContextValue {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacterStore вне CharacterProvider')
  return ctx
}
