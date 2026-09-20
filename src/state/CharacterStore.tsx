import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

type CharacterPatch = Partial<Character> | ((c: Character) => Character)

interface EditorState {
  draft: Character
  baseline: Character
}

interface CharacterContextValue {
  characters: Character[]
  activeCharacter: Character
  editorCharacter: Character
  editorDirty: boolean
  derived: ReturnType<typeof deriveCharacterStats>
  editorDerived: ReturnType<typeof deriveCharacterStats>
  setActiveCharacterId: (id: string) => void
  updateActiveCharacter: (patch: CharacterPatch) => void
  updateEditorDraft: (patch: CharacterPatch) => void
  saveEditorDraft: () => void
  discardEditorDraft: () => void
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

function applyPatch(character: Character, patch: CharacterPatch): Character {
  return typeof patch === 'function' ? patch(character) : { ...character, ...patch }
}

function mergeEditorDraft(stored: Character, draft: Character, baseline: Character): Character {
  return {
    ...draft,
    inventory: stored.inventory,
    journal: stored.journal,
    money: stored.money,
    combat: stored.combat,
    concentration: stored.concentration,
    tempHp: stored.tempHp,
    currentHp: draft.currentHp !== baseline.currentHp ? draft.currentHp : stored.currentHp,
    spellSlots: stored.spellSlots,
    resources: stored.resources,
  }
}

function writeCharacter(state: ReturnType<typeof loadStorage>, character: Character) {
  const idx = state.characters.findIndex((item) => item.id === state.activeCharacterId)
  if (idx < 0) return state
  const characters = [...state.characters]
  characters[idx] = character
  const next = { ...state, characters }
  saveStorage(next)
  return next
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState(() => loadStorage())
  const [editor, setEditor] = useState<EditorState | null>(null)

  useEffect(() => {
    saveStorage(storage)
  }, [storage])

  const activeCharacter = useMemo(() => {
    const found = storage.characters.find((item) => item.id === storage.activeCharacterId)
    const raw = found ?? storage.characters[0] ?? createBlankCharacter('Новый персонаж')
    return normalize(raw)
  }, [storage])

  const editorCharacter =
    editor && editor.draft.id === activeCharacter.id ? editor.draft : activeCharacter
  const editorDirty = editor != null && editor.draft.id === activeCharacter.id

  const derived = useMemo(() => deriveCharacterStats(activeCharacter), [activeCharacter])
  const editorDerived = useMemo(() => deriveCharacterStats(editorCharacter), [editorCharacter])

  const activeRef = useRef(activeCharacter)
  const editorRef = useRef(editor)
  activeRef.current = activeCharacter
  editorRef.current = editor

  const setActiveCharacterId = useCallback((id: string) => {
    setEditor(null)
    setStorage((state) => ({ ...state, activeCharacterId: id }))
  }, [])

  const updateActiveCharacter = useCallback((patch: CharacterPatch) => {
    setStorage((state) => {
      const idx = state.characters.findIndex((item) => item.id === state.activeCharacterId)
      if (idx < 0) return state
      const current = state.characters[idx]
      const next = normalize(touch(applyPatch(current, patch)))
      const characters = [...state.characters]
      characters[idx] = next
      return { ...state, characters }
    })
  }, [])

  const updateEditorDraft = useCallback((patch: CharacterPatch) => {
    setEditor((current) => {
      const stored = activeRef.current
      const base = current && current.draft.id === stored.id ? current.draft : stored
      const baseline = current && current.draft.id === stored.id ? current.baseline : stored
      return {
        draft: applyPatch(base, patch),
        baseline,
      }
    })
  }, [])

  const saveEditorDraft = useCallback(() => {
    const current = editorRef.current
    setStorage((state) => {
      const idx = state.characters.findIndex((item) => item.id === state.activeCharacterId)
      if (idx < 0) return state
      const stored = state.characters[idx]
      const merged =
        current && current.draft.id === stored.id
          ? mergeEditorDraft(stored, current.draft, current.baseline)
          : stored
      return writeCharacter(state, normalize(touch(merged)))
    })
    setEditor(null)
  }, [])

  const discardEditorDraft = useCallback(() => {
    setEditor(null)
  }, [])

  const createCharacter = useCallback((character: Character) => {
    const created = normalize({
      ...character,
      id: character.id || createId(),
      createdAt: character.createdAt || new Date().toISOString(),
    })
    setEditor(null)
    setStorage((state) => ({
      ...state,
      characters: [...state.characters, created],
      activeCharacterId: created.id,
    }))
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setEditor(null)
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
    const json = exportCharacterJson(editorCharacter)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${editorCharacter.name || 'персонаж'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [editorCharacter])

  const importCharacter = useCallback((json: string) => {
    const imported = normalize({ ...importCharacterJson(json), id: createId() })
    setEditor(null)
    setStorage((state) => ({
      ...state,
      characters: [...state.characters, imported],
      activeCharacterId: imported.id,
    }))
  }, [])

  const resetData = useCallback(() => {
    setEditor(null)
    setStorage(resetAllData())
  }, [])

  const value: CharacterContextValue = {
    characters: storage.characters,
    activeCharacter,
    editorCharacter,
    editorDirty,
    derived,
    editorDerived,
    setActiveCharacterId,
    updateActiveCharacter,
    updateEditorDraft,
    saveEditorDraft,
    discardEditorDraft,
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
