import { useState } from 'react'
import {
  getClassCantrips,
  getPreparableClassSpells,
  getSpell,
  getSpellsByIds,
  groupSpellsByLevel,
} from '../data/spells'
import { getCantripsKnown, getPreparedSpellCount, getSpellSlots } from '../rules'
import { maxSpellSlotLevel } from '../engine/spellPreparation'
import { calculateAbilityModifier } from '../engine/abilities'

interface Props {
  classId: string
  level: number
  wisdom: number
  preparedIds: string[]
  cantripIds: string[]
  domainIds: string[]
  onPreparedChange: (ids: string[]) => void
  onCantripsChange: (ids: string[]) => void
  onExplainLimit?: () => void
}

function levelLabel(level: number): string {
  return level === 0 ? 'Заговоры' : `${level} круг`
}

export function SpellPreparationPicker({
  classId,
  level,
  wisdom,
  preparedIds,
  cantripIds,
  domainIds,
  onPreparedChange,
  onCantripsChange,
  onExplainLimit,
}: Props) {
  const [cantripChoice, setCantripChoice] = useState('')
  const [preparedChoice, setPreparedChoice] = useState('')

  const wisMod = calculateAbilityModifier(wisdom)
  const preparedLimit = getPreparedSpellCount(classId, level, wisMod)
  const cantripLimit = getCantripsKnown(classId, level)
  const slots = getSpellSlots(classId, level)
  const slotLevel = maxSpellSlotLevel(slots)

  const availableCantrips = getClassCantrips(classId).filter((s) => !cantripIds.includes(s.id))
  const availablePrepared = getPreparableClassSpells(classId, slotLevel).filter(
    (s) => !preparedIds.includes(s.id) && !domainIds.includes(s.id),
  )

  const addCantrip = () => {
    if (!cantripChoice) return
    if (cantripIds.includes(cantripChoice)) return
    if (cantripLimit > 0 && cantripIds.length >= cantripLimit) {
      alert(
        `По таблице жреца 2014 на ${level} уровне известно ${cantripLimit} заговоров. Снимите один, чтобы взять другой.`,
      )
      return
    }
    onCantripsChange([...cantripIds, cantripChoice])
    setCantripChoice('')
  }

  const addPrepared = () => {
    if (!preparedChoice) return
    if (preparedIds.includes(preparedChoice) || domainIds.includes(preparedChoice)) return
    if (preparedLimit > 0 && preparedIds.length >= preparedLimit) {
      alert(
        `По правилам 2014 жрец готовит не больше ${preparedLimit} заклинаний: модификатор мудрости + уровень, минимум 1. Доменные заклинания в этот лимит не входят.`,
      )
      return
    }
    onPreparedChange([...preparedIds, preparedChoice])
    setPreparedChoice('')
  }

  if (classId !== 'cleric') {
    return (
      <p className="muted small">
        Для этого класса в приложении пока нет списка заклинаний 2014.
      </p>
    )
  }

  return (
    <div className="spell-prep">
      <p className="muted small">
        Список заклинаний жреца из Книги игрока 2014. Готовить можно только круги, для которых есть
        ячейки. Доменные заклинания всегда подготовлены и сюда не считаются.
      </p>

      <div className="prep-count-row">
        <button
          type="button"
          className={`prep-count ${preparedIds.length > preparedLimit ? 'over' : ''}`}
          onClick={onExplainLimit}
        >
          Подготовлено {preparedIds.length} из {preparedLimit}
        </button>
        <span className="muted small">Заговоры {cantripIds.length} из {cantripLimit}</span>
      </div>

      <label className="field">
        Известный заговор
        <div className="spell-picker">
          <select
            className="input"
            value={cantripChoice}
            onChange={(e) => setCantripChoice(e.target.value)}
          >
            <option value="">Выберите заговор</option>
            {groupSpellsByLevel(availableCantrips).map((group) => (
              <optgroup key={group.level} label={levelLabel(group.level)}>
                {group.spells.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" className="btn" onClick={addCantrip} disabled={!cantripChoice}>
            Добавить
          </button>
        </div>
      </label>

      <label className="field">
        Подготовить заклинание
        <div className="spell-picker">
          <select
            className="input"
            value={preparedChoice}
            onChange={(e) => setPreparedChoice(e.target.value)}
          >
            <option value="">Выберите заклинание</option>
            {groupSpellsByLevel(availablePrepared).map((group) => (
              <optgroup key={group.level} label={levelLabel(group.level)}>
                {group.spells.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({group.level} кр.)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" className="btn" onClick={addPrepared} disabled={!preparedChoice}>
            Подготовить
          </button>
        </div>
      </label>

      {cantripIds.length > 0 && (
        <div className="chosen-spells">
          <h4 className="mini-title">Известные заговоры</h4>
          {getSpellsByIds(cantripIds).map((s) => (
            <div key={s.id} className="chosen-spell">
              <span>
                {s.name} <span className="muted">заговор</span>
              </span>
              <button
                type="button"
                className="btn-small"
                onClick={() => onCantripsChange(cantripIds.filter((id) => id !== s.id))}
              >
                Убрать
              </button>
            </div>
          ))}
        </div>
      )}

      {preparedIds.length > 0 && (
        <div className="chosen-spells">
          <h4 className="mini-title">Подготовленные</h4>
          {getSpellsByIds(preparedIds).map((s) => (
            <div key={s.id} className="chosen-spell">
              <span>
                {s.name} <span className="muted">{s.level} кр.</span>
              </span>
              <button
                type="button"
                className="btn-small"
                onClick={() => onPreparedChange(preparedIds.filter((id) => id !== s.id))}
              >
                Снять
              </button>
            </div>
          ))}
        </div>
      )}

      {domainIds.length > 0 && (
        <p className="muted small">
          Всегда подготовлены доменом:{' '}
          {domainIds
            .map((id) => getSpell(id)?.name)
            .filter(Boolean)
            .join(', ')}
        </p>
      )}
    </div>
  )
}
