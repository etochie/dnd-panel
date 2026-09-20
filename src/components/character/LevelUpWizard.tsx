import { useState } from 'react'
import type { AsiChoice, Character } from '../../types/character'
import { applyLevelUp, getClassHitDie, previewLevelUp } from '../../rules'
import { AsiPicker } from './AsiPicker'
import { NumberStepper } from '../NumberStepper'

interface Props {
  character: Character
  onApply: (next: Character) => void
  onCancel: () => void
}

export function LevelUpWizard({ character, onApply, onCancel }: Props) {
  const preview = previewLevelUp(character)
  const [hpRoll, setHpRoll] = useState(1)
  const [asiChoice, setAsiChoice] = useState<AsiChoice | null>(null)

  if (!preview) {
    return (
      <div className="wizard">
        <p>Персонаж уже 20 уровня.</p>
        <button type="button" className="btn" onClick={onCancel}>
          Закрыть
        </button>
      </div>
    )
  }

  const canApply = (!preview.needsAsi || asiChoice != null) && (!preview.needsHpRoll || hpRoll >= 1)

  return (
    <div className="wizard">
      <h2 className="section-title">Повышение уровня</h2>
      <h3 className="mini-title">Что изменилось</h3>
      <ul>
        {preview.changes.map((change) => (
          <li key={`${change.label}-${change.detail}`}>
            <strong>{change.label}:</strong> {change.detail}
          </li>
        ))}
      </ul>

      {preview.needsHpRoll && (
        <label className="field">
          Результат броска d{getClassHitDie(character.classId)}
          <NumberStepper
            label="Бросок кости хитов"
            value={hpRoll}
            min={1}
            max={getClassHitDie(character.classId)}
            onChange={setHpRoll}
          />
        </label>
      )}

      {preview.needsAsi && !asiChoice && (
        <AsiPicker
          level={preview.toLevel}
          allowFeats={character.allowFeats}
          onConfirm={setAsiChoice}
        />
      )}
      {preview.needsAsi && asiChoice && (
        <p className="ok-box">Выбор улучшения характеристик сохранен. Можно повышать уровень.</p>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canApply}
          onClick={() =>
            onApply(
              applyLevelUp(character, {
                asiChoice: asiChoice ?? undefined,
                hpRoll: preview.needsHpRoll ? hpRoll : undefined,
              }),
            )
          }
        >
          Повысить до {preview.toLevel} уровня
        </button>
      </div>
    </div>
  )
}
