import type { AbilityKey } from '../../types/character'
import { ABILITY_KEYS } from '../../rules/core/types'
import { ABILITY_LABELS, formatModifier } from '../../rules'
import {
  POINT_BUY_LIMIT,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  pointBuyCostForScore,
  pointBuySpent,
} from '../../rules'
import { STANDARD_ARRAY } from '../../rules'
import { NumberStepper } from '../NumberStepper'
import type { AbilityGenerationMethod } from '../../types/character'

interface Parts {
  base: number
  racial: number
  asi: number
  total: number
  modifier: number
}

interface Props {
  method: AbilityGenerationMethod
  baseAbilities: Record<AbilityKey, number>
  parts: Record<AbilityKey, Parts>
  onChangeBase: (next: Record<AbilityKey, number>) => void
  showTotals?: boolean
}

export function AbilityAssigner({
  method,
  baseAbilities,
  parts,
  onChangeBase,
  showTotals = true,
}: Props) {
  const spent = pointBuySpent(ABILITY_KEYS.map((key) => baseAbilities[key]))
  const remaining = POINT_BUY_LIMIT - spent
  const usedArray = ABILITY_KEYS.map((key) => baseAbilities[key])

  const setBase = (key: AbilityKey, value: number) => {
    onChangeBase({ ...baseAbilities, [key]: value })
  }

  const assignArrayValue = (key: AbilityKey, value: number) => {
    const current = baseAbilities[key]
    const swapWith = ABILITY_KEYS.find((other) => other !== key && baseAbilities[other] === value)
    const next = { ...baseAbilities, [key]: value }
    if (swapWith) next[swapWith] = current
    onChangeBase(next)
  }

  return (
    <div className="ability-assign">
      {method === 'point_buy' && (
        <p className={`budget-line ${remaining < 0 ? 'over' : remaining === 0 ? 'ok' : ''}`}>
          Очки потрачены: {spent} / {POINT_BUY_LIMIT}. Осталось: {remaining}.
        </p>
      )}
      {method === 'standard_array' && (
        <p className="muted small">Распределите набор 15, 14, 13, 12, 10 и 8.</p>
      )}
      {method === 'manual' && (
        <p className="muted small">Ручной ввод базовых значений. Расовые бонусы применятся отдельно.</p>
      )}

      <div className="ability-edit-grid">
        {ABILITY_KEYS.map((key) => {
          const part = parts[key]
          return (
            <div key={key} className="ability-card">
              <strong>{ABILITY_LABELS[key]}</strong>
              {method === 'standard_array' ? (
                <label className="field">
                  Базовое значение
                  <select
                    className="input"
                    value={baseAbilities[key]}
                    onChange={(event) => assignArrayValue(key, Number(event.target.value))}
                  >
                    {[...new Set([...STANDARD_ARRAY, baseAbilities[key]])].map((value) => (
                      <option key={value} value={value}>
                        {value}
                        {usedArray.filter((item) => item === value).length > 1 && value === baseAbilities[key]
                          ? ''
                          : usedArray.includes(value) && value !== baseAbilities[key]
                            ? ' (занято)'
                            : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  Базовое значение
                  <NumberStepper
                    label={ABILITY_LABELS[key]}
                    value={baseAbilities[key]}
                    min={method === 'point_buy' ? POINT_BUY_MIN : 1}
                    max={method === 'point_buy' ? POINT_BUY_MAX : 30}
                    onChange={(value) => setBase(key, value)}
                  />
                </label>
              )}
              {method === 'point_buy' && (
                <p className="muted small">Стоимость: {pointBuyCostForScore(baseAbilities[key])}</p>
              )}
              {showTotals && (
                <ul className="ability-parts">
                  <li>Базовое значение: {part.base}</li>
                  <li>Расовый бонус: {part.racial ? formatModifier(part.racial) : 'нет'}</li>
                  {part.asi > 0 && <li>Улучшение характеристик: {formatModifier(part.asi)}</li>}
                  <li>
                    Итог: {part.total} ({formatModifier(part.modifier)})
                  </li>
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
