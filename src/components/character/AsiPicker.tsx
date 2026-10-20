import { useState } from 'react'
import type { AbilityKey, AsiChoice } from '../../types/character'
import { ABILITY_KEYS } from '../../rules/core/types'
import {
  ABILITY_LABELS,
  ABILITY_SCORE_CAP,
  createFeatChoice,
  createPlusOnePlusOneChoice,
  createPlusTwoChoice,
} from '../../rules'
import { OPTIONAL_FEATS_2014 } from '../../data/feats'

interface Props {
  level: number
  allowFeats: boolean
  /** Итоговые значения характеристик без улучшения этого уровня. Нужны для проверки предела 20. */
  currentScores?: Record<AbilityKey, number>
  onConfirm: (choice: AsiChoice) => void
  onCancel?: () => void
}

export function AsiPicker({ level, allowFeats, currentScores, onConfirm, onCancel }: Props) {
  const [mode, setMode] = useState<'plus2' | 'plus1' | 'feat'>('plus2')
  const [first, setFirst] = useState<AbilityKey>('str')
  const [second, setSecond] = useState<AbilityKey>('dex')
  const [featId, setFeatId] = useState(OPTIONAL_FEATS_2014[0].id)

  const overCap = (): AbilityKey[] => {
    if (!currentScores || mode === 'feat') return []
    const increases: Partial<Record<AbilityKey, number>> =
      mode === 'plus2'
        ? { [first]: 2 }
        : first === second
          ? { [first]: 2 }
          : { [first]: 1, [second]: 1 }
    return ABILITY_KEYS.filter(
      (key) => (increases[key] ?? 0) > 0 && currentScores[key] + (increases[key] ?? 0) > ABILITY_SCORE_CAP,
    )
  }
  const blocked = overCap()

  const submit = () => {
    if (blocked.length > 0) return
    if (mode === 'plus2') {
      onConfirm(createPlusTwoChoice(level, first))
      return
    }
    if (mode === 'plus1') {
      onConfirm(createPlusOnePlusOneChoice(level, first, second))
      return
    }
    const feat = OPTIONAL_FEATS_2014.find((item) => item.id === featId) ?? OPTIONAL_FEATS_2014[0]
    onConfirm(createFeatChoice(level, feat.id, feat.name))
  }

  return (
    <div className="asi-picker">
      <h4 className="mini-title">Улучшение характеристик</h4>
      <p className="muted small">Выберите один вариант для {level} уровня.</p>
      <label className="check-row">
        <input type="radio" checked={mode === 'plus2'} onChange={() => setMode('plus2')} />
        Вариант A: +2 к одной характеристике
      </label>
      <label className="check-row">
        <input type="radio" checked={mode === 'plus1'} onChange={() => setMode('plus1')} />
        Вариант B: +1 к двум характеристикам
      </label>
      {allowFeats && (
        <label className="check-row">
          <input type="radio" checked={mode === 'feat'} onChange={() => setMode('feat')} />
          Взять черту вместо улучшения
        </label>
      )}

      {mode === 'plus2' && (
        <label className="field">
          Характеристика
          <select className="input" value={first} onChange={(event) => setFirst(event.target.value as AbilityKey)}>
            {ABILITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {ABILITY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'plus1' && (
        <>
          <label className="field">
            Первая характеристика
            <select className="input" value={first} onChange={(event) => setFirst(event.target.value as AbilityKey)}>
              {ABILITY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ABILITY_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Вторая характеристика
            <select className="input" value={second} onChange={(event) => setSecond(event.target.value as AbilityKey)}>
              {ABILITY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ABILITY_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {mode === 'feat' && (
        <label className="field">
          Черта
          <select className="input" value={featId} onChange={(event) => setFeatId(event.target.value)}>
            {OPTIONAL_FEATS_2014.map((feat) => (
              <option key={feat.id} value={feat.id}>
                {feat.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {blocked.length > 0 && (
        <p className="warn-box small">
          Значение характеристики не может быть выше {ABILITY_SCORE_CAP}:{' '}
          {blocked.map((key) => ABILITY_LABELS[key]).join(', ')}.
        </p>
      )}
      <div className="row-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={blocked.length > 0} onClick={submit}>
          Подтвердить выбор
        </button>
      </div>
    </div>
  )
}
