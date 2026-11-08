import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  summary: string
  children: ReactNode
}

export function Fold({ title, summary, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="card fold">
      <button
        type="button"
        className="fold-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fold-title">
          <strong>{title}</strong>
          {!open && <span className="muted small">{summary}</span>}
        </span>
        <span className="fold-state">{open ? 'Свернуть' : 'Открыть'}</span>
      </button>
      {open && <div className="fold-body">{children}</div>}
    </section>
  )
}
