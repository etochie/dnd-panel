import { useState } from 'react'
import type { AsiChoice, Character } from '../../types/character'
import { abilityScoresWithoutAsiLevel, describeAsiChoice } from '../../rules'
import { AsiPicker } from './AsiPicker'

interface Props {
  character: Character
  onChange: (asiChoices: AsiChoice[]) => void
  confirmReset?: (level: number, proceed: () => void) => void
}

export function AsiChoicesEditor({ character, onChange, confirmReset }: Props) {
  const [editingLevel, setEditingLevel] = useState<number | null>(null)
  const choices = [...(character.asiChoices ?? [])].sort((a, b) => a.level - b.level)

  if (choices.length === 0) return null

  const replace = (choice: AsiChoice) => {
    onChange([...choices.filter((item) => item.level !== choice.level), choice])
    setEditingLevel(null)
  }

  const reset = (level: number) => {
    const proceed = () => {
      onChange(choices.filter((item) => item.level !== level))
      setEditingLevel(null)
    }
    if (confirmReset) {
      confirmReset(level, proceed)
      return
    }
    if (!confirm(`Сбросить улучшение характеристик ${level} уровня?`)) return
    proceed()
  }

  return (
    <div className="asi-choices-editor">
      <h4 className="mini-title">Выбранные улучшения характеристик</h4>
      <ul className="stack">
        {choices.map((choice) => (
          <li key={choice.level}>
            <p>{describeAsiChoice(choice)}</p>
            {editingLevel === choice.level ? (
              <AsiPicker
                key={choice.level}
                level={choice.level}
                allowFeats={character.allowFeats}
                currentScores={abilityScoresWithoutAsiLevel(character, choice.level)}
                onConfirm={replace}
                onCancel={() => setEditingLevel(null)}
              />
            ) : (
              <div className="row-actions">
                <button type="button" className="btn-small" onClick={() => setEditingLevel(choice.level)}>
                  Изменить
                </button>
                <button type="button" className="btn-small" onClick={() => reset(choice.level)}>
                  Сбросить
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
