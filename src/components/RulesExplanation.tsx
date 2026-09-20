import type { CalculationBreakdown } from '../types/explain'
import './RulesExplanation.css'

interface Props {
  breakdown: CalculationBreakdown | null
  onClose: () => void
}

export function RulesExplanation({ breakdown, onClose }: Props) {
  if (!breakdown) return null
  return (
    <div className="explain-overlay" role="dialog" aria-modal="true">
      <div className="explain-panel">
        <header>
          <h3>{breakdown.title}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <p className="explain-result">{breakdown.result}</p>
        <ul>
          {breakdown.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {breakdown.unknown && (
          <p className="unknown-rule">Нет достоверных данных D&D 5e 2014 для этого значения.</p>
        )}
      </div>
    </div>
  )
}

interface HintProps {
  term: string
  text: string
  onShow: (title: string, text: string) => void
}

export function MechanicHint({ term, text, onShow }: HintProps) {
  return (
    <button type="button" className="link-hint" onClick={() => onShow(term, text)}>
      {term}
    </button>
  )
}
