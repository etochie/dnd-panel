import { useEffect, useState } from 'react'
import { CONDITIONS_2014 } from '../data/conditions'
import { labelList, PROFICIENCY_LABELS } from '../data/labels'
import { SKILLS_2014 } from '../data/skills'
import { ABILITY_LABELS } from '../engine/abilities'
import { CLASSES, subclassesForClass } from '../data/classes'
import { domainSpellIdsForLevel } from '../data/deathDomain'
import { levelUpCharacter, useCharacterStore } from '../state/CharacterStore'
import type { AbilityKey } from '../types/character'
import { SpellPreparationPicker } from './SpellPreparationPicker'

const ABILITY_MIN = 1
const ABILITY_MAX = 30
const ABILITY_KEYS = Object.keys(ABILITY_LABELS) as AbilityKey[]

function clampAbility(value: number): number {
  return Math.min(ABILITY_MAX, Math.max(ABILITY_MIN, value))
}

function AbilityScoreEditor({
  values,
  onChange,
}: {
  values: Record<AbilityKey, number>
  onChange: (next: Record<AbilityKey, number>) => void
}) {
  const setScore = (key: AbilityKey, value: number) => {
    onChange({ ...values, [key]: clampAbility(value) })
  }

  return (
    <div className="ability-edit-grid">
      {ABILITY_KEYS.map((key) => (
        <AbilityScoreField
          key={key}
          abilityKey={key}
          value={values[key]}
          onChange={(value) => setScore(key, value)}
        />
      ))}
    </div>
  )
}

function AbilityScoreField({
  abilityKey,
  value,
  onChange,
}: {
  abilityKey: AbilityKey
  value: number
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const label = ABILITY_LABELS[abilityKey]

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (next: number) => {
    const clamped = clampAbility(next)
    onChange(clamped)
    setDraft(String(clamped))
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="ability-stepper">
        <button
          type="button"
          className="btn-small ability-stepper-btn"
          disabled={value <= ABILITY_MIN}
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
            if (!Number.isNaN(parsed)) onChange(clampAbility(parsed))
          }}
          onBlur={() => {
            const parsed = parseInt(draft, 10)
            commit(Number.isNaN(parsed) ? ABILITY_MIN : parsed)
          }}
        />
        <button
          type="button"
          className="btn-small ability-stepper-btn"
          disabled={value >= ABILITY_MAX}
          aria-label={`Увеличить ${label}`}
          onClick={() => commit(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function CharacterManagePanel() {
  const {
    characters,
    activeCharacter,
    derived,
    setActiveCharacterId,
    updateActiveCharacter,
    createCharacter,
    deleteCharacter,
    exportActive,
    importCharacter,
    resetData,
  } = useCharacterStore()
  const [newName, setNewName] = useState('')

  const importFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        importCharacter(text)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Ошибка импорта')
      }
    }
    input.click()
  }

  const levelUp = () => {
    if (activeCharacter.level >= 20) {
      alert('Максимальный уровень 20.')
      return
    }
    const next = levelUpCharacter(activeCharacter)
    const changes = [
      `Уровень: ${activeCharacter.level} → ${next.level}`,
      `Бонус мастерства: ${derived.proficiencyBonus} (пересчитается автоматически)`,
      'Ячейки заклинаний обновлены по таблице жреца.',
    ]
    if (!confirm(`Повысить уровень?\n\n${changes.join('\n')}`)) return
    updateActiveCharacter(next)
  }

  const submitCreate = () => {
    const name = newName.trim()
    if (!name) {
      alert('Укажите имя персонажа.')
      return
    }
    createCharacter(name)
    setNewName('')
  }

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Создать персонажа</h2>
        <p className="muted small">
          Создайте каркас по имени. Расу, класс, характеристики и остальное можно сразу
          поправить в редакторе.
        </p>
        <label className="field">
          Имя
          <input
            className="input"
            value={newName}
            placeholder="Новый персонаж"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitCreate()
              }
            }}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={submitCreate}>
          Создать персонажа
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Какого персонажа редактировать</h3>
        <label className="field">
          Персонаж
          <select
            className="input"
            value={activeCharacter.id}
            onChange={(e) => setActiveCharacterId(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || 'Без имени'}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (confirm('Удалить текущего персонажа?')) deleteCharacter(activeCharacter.id)
          }}
        >
          Удалить
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Редактор</h3>
        <label className="field">
          Имя
          <input
            className="input"
            value={activeCharacter.name}
            onChange={(e) => updateActiveCharacter({ name: e.target.value })}
          />
        </label>
        <label className="field">
          Раса
          <input
            className="input"
            value={activeCharacter.race}
            onChange={(e) => updateActiveCharacter({ race: e.target.value })}
          />
        </label>
        <label className="field">
          Класс
          <select
            className="input"
            value={activeCharacter.classId}
            onChange={(e) => updateActiveCharacter({ classId: e.target.value })}
          >
            {CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Подкласс
          <select
            className="input"
            value={activeCharacter.subclassId ?? ''}
            onChange={(e) => {
              const subclassId = e.target.value || undefined
              updateActiveCharacter({
                subclassId,
                domainSpellIds:
                  subclassId === 'death_domain'
                    ? domainSpellIdsForLevel(activeCharacter.level)
                    : [],
              })
            }}
          >
            <option value="">Не выбран</option>
            {subclassesForClass(activeCharacter.classId).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Уровень
          <input
            className="input"
            type="number"
            min={1}
            max={20}
            value={activeCharacter.level}
            readOnly
          />
        </label>
        <label className="field">
          Предыстория
          <input
            className="input"
            value={activeCharacter.background}
            onChange={(e) => updateActiveCharacter({ background: e.target.value })}
          />
        </label>
        <label className="field">
          Мировоззрение
          <input
            className="input"
            value={activeCharacter.alignment}
            onChange={(e) => updateActiveCharacter({ alignment: e.target.value })}
          />
        </label>
        <AbilityScoreEditor
          key={activeCharacter.id}
          values={activeCharacter.abilities}
          onChange={(abilities) => updateActiveCharacter({ abilities })}
        />
        <label className="field">
          Максимум хитов (ручное значение)
          <input
            type="number"
            min={1}
            className="input"
            value={activeCharacter.maxHpOverride ?? derived.maxHp}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              updateActiveCharacter({ maxHpOverride: Number.isNaN(v) ? null : v })
            }}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={levelUp}>
          Повысить уровень
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Заклинания</h3>
        <SpellPreparationPicker
          classId={activeCharacter.classId}
          level={activeCharacter.level}
          wisdom={activeCharacter.abilities.wis}
          preparedIds={activeCharacter.preparedSpellIds}
          cantripIds={activeCharacter.cantripIds}
          domainIds={activeCharacter.domainSpellIds}
          onPreparedChange={(preparedSpellIds) => updateActiveCharacter({ preparedSpellIds })}
          onCantripsChange={(cantripIds) => updateActiveCharacter({ cantripIds })}
        />
      </section>

      <section className="card">
        <h3 className="section-title">Владения</h3>
        <p className="muted small">
          Броня: {labelList(activeCharacter.proficiencies.armor, PROFICIENCY_LABELS)} · Оружие:{' '}
          {labelList(activeCharacter.proficiencies.weapons, PROFICIENCY_LABELS)} · Языки:{' '}
          {labelList(activeCharacter.proficiencies.languages, PROFICIENCY_LABELS)}
        </p>
        <textarea
          className="textarea"
          placeholder="Прочие владения (через запятую)"
          value={activeCharacter.proficiencies.other.join(', ')}
          onChange={(e) =>
            updateActiveCharacter({
              proficiencies: {
                ...activeCharacter.proficiencies,
                other: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </section>

      <section className="card">
        <h3 className="section-title">Навыки и спасброски</h3>
        <div className="skills-edit">
          {SKILLS_2014.map((s) => {
            const prof = activeCharacter.skillProficiencies.includes(s.id)
            return (
              <label key={s.id} className="check-row">
                <input
                  type="checkbox"
                  checked={prof}
                  onChange={() => {
                    const list = prof
                      ? activeCharacter.skillProficiencies.filter((x) => x !== s.id)
                      : [...activeCharacter.skillProficiencies, s.id]
                    updateActiveCharacter({ skillProficiencies: list })
                  }}
                />
                {s.name}
              </label>
            )
          })}
        </div>
        <h4>Спасброски</h4>
        <div className="skills-edit">
          {ABILITY_KEYS.map((key) => {
            const prof = activeCharacter.saveProficiencies.includes(key)
            return (
              <label key={key} className="check-row">
                <input
                  type="checkbox"
                  checked={prof}
                  onChange={() => {
                    const list = prof
                      ? activeCharacter.saveProficiencies.filter((x) => x !== key)
                      : [...activeCharacter.saveProficiencies, key]
                    updateActiveCharacter({ saveProficiencies: list })
                  }}
                />
                {ABILITY_LABELS[key]}
              </label>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Состояния</h3>
        <div className="skills-edit">
          {CONDITIONS_2014.map((c) => {
            const on = activeCharacter.conditions.includes(c.id)
            return (
              <label key={c.id} className="check-row" title={c.description}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    const list = on
                      ? activeCharacter.conditions.filter((x) => x !== c.id)
                      : [...activeCharacter.conditions, c.id]
                    updateActiveCharacter({ conditions: list })
                  }}
                />
                {c.name}
              </label>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Телефон</h3>
        <p className="muted small">
          С публичного адреса сайт открывается из любой сети, регистрация не нужна. Персонаж
          хранится в браузере на этом устройстве. Если вы перешли с другого адреса, перенесите
          данные экспортом и импортом файла.
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Сохранение</h3>
        <p className="muted small">Данные сохраняются автоматически в хранилище браузера.</p>
        <div className="row-actions">
          <button type="button" className="btn" onClick={exportActive}>
            Экспорт файла
          </button>
          <button type="button" className="btn" onClick={importFile}>
            Импорт файла
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Сбросить все данные и загрузить тестового жреца?')) resetData()
            }}
          >
            Сброс данных
          </button>
        </div>
      </section>
    </div>
  )
}
