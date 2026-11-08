import { useEffect, useState } from 'react'
import {
  useTableMode,
  type AmountDialog,
  type ChoiceDialog,
  type ConfirmDialog,
  type NoticeDialog,
} from '../../state/TableMode'

export function TableDialogHost() {
  const { dialog, closeDialog } = useTableMode()

  useEffect(() => {
    if (!dialog) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, closeDialog])

  if (!dialog) return null

  return (
    <div className="table-dialog-overlay">
      <button type="button" className="table-dialog-backdrop" aria-label="Закрыть" onClick={closeDialog} />
      <div
        className="table-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-dialog-title"
      >
        <header>
          <h3 id="table-dialog-title">{dialog.title}</h3>
          <button type="button" className="btn-icon" onClick={closeDialog} aria-label="Закрыть">
            ×
          </button>
        </header>
        {dialog.kind === 'amount' && <AmountForm dialog={dialog} onClose={closeDialog} />}
        {dialog.kind === 'confirm' && <ConfirmForm dialog={dialog} onClose={closeDialog} />}
        {dialog.kind === 'notice' && <NoticeForm dialog={dialog} onClose={closeDialog} />}
        {dialog.kind === 'choice' && <ChoiceForm dialog={dialog} onClose={closeDialog} />}
      </div>
    </div>
  )
}

function AmountForm({ dialog, onClose }: { dialog: AmountDialog; onClose: () => void }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const apply = (raw: string) => {
    const value = parseInt(raw, 10)
    if (raw.trim() === '' || Number.isNaN(value) || value < 0) {
      setError('Введите число от 0.')
      return
    }
    onClose()
    dialog.onApply(value)
  }

  return (
    <>
      <div className="amount-grid">
        {dialog.presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className="amount-preset"
            onClick={() => apply(String(preset))}
          >
            {preset}
          </button>
        ))}
      </div>
      <label className="field">
        Своё число
        <input
          className="input"
          inputMode="numeric"
          autoFocus
          value={draft}
          aria-label="Своё число"
          onChange={(event) => {
            setDraft(event.target.value.replace(/\D/g, ''))
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') apply(draft)
          }}
        />
      </label>
      {error && <p className="warn-box small">{error}</p>}
      <div className="row-actions">
        <button type="button" className="btn" onClick={onClose}>
          Отмена
        </button>
        <button type="button" className="btn btn-primary" onClick={() => apply(draft)}>
          Применить
        </button>
      </div>
    </>
  )
}

function ConfirmForm({ dialog, onClose }: { dialog: ConfirmDialog; onClose: () => void }) {
  return (
    <>
      <p>{dialog.text}</p>
      <div className="row-actions">
        <button type="button" className="btn" onClick={onClose}>
          Отмена
        </button>
        <button
          type="button"
          className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            onClose()
            dialog.onConfirm()
          }}
        >
          {dialog.confirmLabel}
        </button>
      </div>
    </>
  )
}

function NoticeForm({ dialog, onClose }: { dialog: NoticeDialog; onClose: () => void }) {
  return (
    <>
      <p>{dialog.text}</p>
      <button type="button" className="btn btn-primary" onClick={onClose}>
        Понятно
      </button>
    </>
  )
}

function ChoiceForm({ dialog, onClose }: { dialog: ChoiceDialog; onClose: () => void }) {
  return (
    <>
      {dialog.text && <p>{dialog.text}</p>}
      {dialog.hint && <p className="muted small">{dialog.hint}</p>}
      <div className="choice-stack">
        {dialog.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="btn choice-option"
            disabled={option.disabled}
            onClick={() => {
              onClose()
              dialog.onChoose(option.id)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={onClose}>
        Отмена
      </button>
    </>
  )
}
