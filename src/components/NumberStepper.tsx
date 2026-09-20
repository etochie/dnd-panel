import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  label: string
}

export function NumberStepper({ value, onChange, min, max, label }: Props) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next))
    onChange(clamped)
    setDraft(String(clamped))
  }

  return (
    <div className="ability-stepper">
      <button
        type="button"
        className="btn-small ability-stepper-btn"
        disabled={value <= min}
        aria-label={`Уменьшить ${label}`}
        onClick={() => commit(value - 1)}
      >
        −
      </button>
      <input
        className="input ability-stepper-input"
        inputMode="numeric"
        value={draft}
        aria-label={label}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          setDraft(raw)
          if (raw === '') return
          const parsed = parseInt(raw, 10)
          if (!Number.isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
        }}
        onBlur={() => {
          const parsed = parseInt(draft, 10)
          commit(Number.isNaN(parsed) ? min : parsed)
        }}
      />
      <button
        type="button"
        className="btn-small ability-stepper-btn"
        disabled={value >= max}
        aria-label={`Увеличить ${label}`}
        onClick={() => commit(value + 1)}
      >
        +
      </button>
    </div>
  )
}
