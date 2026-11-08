import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'dnd-panel-table-mode'

export type TableMode = 'new' | 'classic'

const AMOUNT_PRESETS = [1, 2, 5, 10, 15, 20]

export interface AmountDialog {
  kind: 'amount'
  title: string
  presets: number[]
  onApply: (value: number) => void
}

export interface ConfirmDialog {
  kind: 'confirm'
  title: string
  text: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

export interface NoticeDialog {
  kind: 'notice'
  title: string
  text: string
}

export interface ChoiceOption {
  id: string
  label: string
  disabled?: boolean
}

export interface ChoiceDialog {
  kind: 'choice'
  title: string
  text?: string
  hint?: string
  options: ChoiceOption[]
  onChoose: (id: string) => void
}

export type TableDialogState = AmountDialog | ConfirmDialog | NoticeDialog | ChoiceDialog

interface TableModeContextValue {
  mode: TableMode
  setMode: (mode: TableMode) => void
  dialog: TableDialogState | null
  closeDialog: () => void
  openAmount: (dialog: Omit<AmountDialog, 'kind' | 'presets'> & { presets?: number[] }) => void
  openConfirm: (dialog: Omit<ConfirmDialog, 'kind'>) => void
  openNotice: (dialog: Omit<NoticeDialog, 'kind'>) => void
  openChoice: (dialog: Omit<ChoiceDialog, 'kind'>) => void
}

const TableModeContext = createContext<TableModeContextValue | null>(null)

function readMode(): TableMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'classic' ? 'classic' : 'new'
  } catch {
    return 'new'
  }
}

export function TableModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<TableMode>(readMode)
  const [dialog, setDialog] = useState<TableDialogState | null>(null)

  const setMode = useCallback((next: TableMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Хранилище браузера может быть закрыто. До перезагрузки выбор всё равно живёт в памяти.
    }
  }, [])

  const closeDialog = useCallback(() => setDialog(null), [])

  const value = useMemo<TableModeContextValue>(
    () => ({
      mode,
      setMode,
      dialog,
      closeDialog,
      openAmount: (next) =>
        setDialog({
          kind: 'amount',
          title: next.title,
          presets: next.presets && next.presets.length > 0 ? next.presets : AMOUNT_PRESETS,
          onApply: next.onApply,
        }),
      openConfirm: (next) => setDialog({ kind: 'confirm', ...next }),
      openNotice: (next) => setDialog({ kind: 'notice', ...next }),
      openChoice: (next) => setDialog({ kind: 'choice', ...next }),
    }),
    [mode, setMode, dialog, closeDialog],
  )

  return <TableModeContext.Provider value={value}>{children}</TableModeContext.Provider>
}

export function useTableMode(): TableModeContextValue {
  const value = useContext(TableModeContext)
  if (!value) {
    throw new Error('Режим стола доступен только внутри TableModeProvider')
  }
  return value
}
