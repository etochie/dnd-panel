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
import { deriveCharacterStats } from '../engine/derived'
import {
  exportCharacterJson,
  importCharacterJson,
  loadStorage,
  resetAllData,
  saveStorage,
} from '../storage/characterStorage'
import { createBlankCharacter } from '../data/testCharacter'
import { createId } from '../utils/id'
import { buildSpellSlotsForCleric } from '../data/classes'
import { domainSpellIdsForLevel } from '../data/deathDomain'
import { calculateRulesMaxHp } from '../engine/hitPoints'

interface CharacterContextValue {
  characters: Character[]
  activeCharacter: Character
  derived: ReturnType<typeof deriveCharacterStats>
  setActiveCharacterId: (id: string) => void
  updateActiveCharacter: (patch: Partial<Character> | ((c: Character) => Character)) => void
  createCharacter: (name: string, extra?: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  exportActive: () => void
  importCharacter: (json: string) => void
  resetData: () => void
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

function touch(character: Character): Character {
  return { ...character, updatedAt: new Date().toISOString() }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState(() => loadStorage())

  useEffect(() => {
    saveStorage(storage)
  }, [storage])

  const activeCharacter = useMemo(() => {
    const found = storage.characters.find((c) => c.id === storage.activeCharacterId)
    return found ?? storage.characters[0] ?? createBlankCharacter('Новый персонаж')
  }, [storage])

  const derived = useMemo(
    () => deriveCharacterStats(activeCharacter),
    [activeCharacter],
  )

  const setActiveCharacterId = useCallback((id: string) => {
    setStorage((s) => ({ ...s, activeCharacterId: id }))
  }, [])

  const updateActiveCharacter = useCallback(
    (patch: Partial<Character> | ((c: Character) => Character)) => {
      setStorage((s) => {
        const idx = s.characters.findIndex((c) => c.id === s.activeCharacterId)
        if (idx < 0) return s
        const current = s.characters[idx]
        const next = touch(
          typeof patch === 'function' ? patch(current) : { ...current, ...patch },
        )
        const characters = [...s.characters]
        characters[idx] = next
        return { ...s, characters }
      })
    },
    [],
  )

  const createCharacter = useCallback((name: string, extra?: Partial<Character>) => {
    const base = createBlankCharacter(name)
    const merged = { ...base, ...extra, id: base.id, createdAt: base.createdAt }
    const level = Math.min(20, Math.max(1, merged.level || 1))
    merged.level = level
    if (merged.classId === 'cleric' && extra?.spellSlots === undefined) {
      merged.spellSlots = buildSpellSlotsForCleric(level)
    }
    if (merged.subclassId === 'death_domain' && extra?.domainSpellIds === undefined) {
      merged.domainSpellIds = domainSpellIdsForLevel(level)
    }
    if (merged.classId === 'cleric' && extra?.saveProficiencies === undefined) {
      merged.saveProficiencies = ['wis', 'cha']
    }
    if (merged.classId === 'cleric' && extra?.proficiencies === undefined) {
      merged.proficiencies = {
        armor: ['light', 'medium', 'shield'],
        weapons: merged.subclassId === 'death_domain' ? ['simple', 'martial'] : ['simple'],
        tools: [],
        languages: ['common'],
        other: [],
      }
    }
    if (merged.classId === 'cleric' && extra?.resources === undefined && level >= 2) {
      const uses = level >= 6 ? 2 : 1
      merged.resources = [
        {
          id: 'channel_divinity',
          name: 'Божественный канал',
          current: uses,
          max: uses,
          recharge: 'short_rest',
          description: 'На 2 уровне жреца - 1 использование, на 6 - 2 (2014).',
        },
      ]
    }
    if (extra?.hitDiceRemaining === undefined) {
      merged.hitDiceRemaining = level
    }
    if (extra?.currentHp === undefined) {
      merged.currentHp = calculateRulesMaxHp(merged).value
    }
    const c = touch(merged)
    setStorage((s) => ({
      ...s,
      characters: [...s.characters, c],
      activeCharacterId: c.id,
    }))
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setStorage((s) => {
      const characters = s.characters.filter((c) => c.id !== id)
      if (characters.length === 0) {
        const blank = createBlankCharacter('Новый персонаж')
        return { ...s, characters: [blank], activeCharacterId: blank.id }
      }
      const activeCharacterId =
        s.activeCharacterId === id ? characters[0].id : s.activeCharacterId
      return { ...s, characters, activeCharacterId }
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
    const imported = importCharacterJson(json)
    imported.id = createId()
    setStorage((s) => ({
      ...s,
      characters: [...s.characters, touch(imported)],
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

  return (
    <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
  )
}

export function useCharacterStore(): CharacterContextValue {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacterStore вне CharacterProvider')
  return ctx
}

export function levelUpCharacter(character: Character): Character {
  if (character.level >= 20) return character
  const level = character.level + 1
  const slots =
    character.classId === 'cleric'
      ? buildSpellSlotsForCleric(level)
      : character.spellSlots
  return touch({
    ...character,
    level,
    spellSlots: slots.map((s) => {
      const old = character.spellSlots.find((x) => x.level === s.level)
      return {
        level: s.level,
        max: s.max,
        current: old ? Math.min(old.current, s.max) : s.max,
      }
    }),
    hitDiceRemaining: character.hitDiceRemaining + 1,
  })
}
