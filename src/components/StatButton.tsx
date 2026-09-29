import type { CalculationBreakdown } from '../types/explain'

interface Props {
  label: string
  value: string
  onExplain: (b: CalculationBreakdown) => void
  breakdown: CalculationBreakdown
  large?: boolean
  hint?: string
}

export function StatButton({ label, value, onExplain, breakdown, large, hint }: Props) {
  return (
    <button
      type="button"
      className={`stat-btn ${large ? 'stat-btn-lg' : ''}`}
      onClick={() => onExplain(breakdown)}
      title={hint}
      data-tooltip={hint || undefined}
    >
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </button>
  )
}
