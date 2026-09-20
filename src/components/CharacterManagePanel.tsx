import { useState, type FormEvent } from 'react'
import { CONDITIONS_2014 } from '../data/conditions'
import { labelList, PROFICIENCY_LABELS } from '../data/labels'
import { SKILLS_2014 } from '../data/skills'
import { ABILITY_LABELS } from '../engine/abilities'
import { buildSpellSlotsForCleric, CLASSES, subclassesForClass } from '../data/classes'
import { domainSpellIdsForLevel } from '../data/deathDomain'
import { getSpell } from '../data/spells'
import { maxSpellSlotLevel } from '../engine/spellPreparation'
import { levelUpCharacter, useCharacterStore } from '../state/CharacterStore'
import type { AbilityKey } from '../types/character'
import { SpellPreparationPicker } from './SpellPreparationPicker'

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

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Персонажи</h2>
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
        <div className="row-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              const name = prompt('Имя нового персонажа:', 'Новый персонаж')
              if (name) createCharacter(name)
            }}
          >
            Создать персонажа
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (confirm('Удалить текущего персонажа?')) deleteCharacter(activeCharacter.id)
            }}
          >
            Удалить
          </button>
        </div>
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
        <div className="ability-edit-grid">
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
            <label key={key} className="field">
              {ABILITY_LABELS[key]}
              <input
                type="number"
                min={1}
                max={30}
                className="input"
                value={activeCharacter.abilities[key]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (Number.isNaN(v)) return
                  updateActiveCharacter({
                    abilities: { ...activeCharacter.abilities, [key]: v },
                  })
                }}
              />
            </label>
          ))}
        </div>
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
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => {
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

      <CreatorWizard />
    </div>
  )
}

function CreatorWizard() {
  const { createCharacter } = useCharacterStore()
  const [name, setName] = useState('Новый герой')
  const [race, setRace] = useState('')
  const [classId, setClassId] = useState('cleric')
  const [subclassId, setSubclassId] = useState('death_domain')
  const [level, setLevel] = useState(1)
  const [background, setBackground] = useState('')
  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  })
  const [preparedIds, setPreparedIds] = useState<string[]>([])
  const [cantripIds, setCantripIds] = useState<string[]>([])

  const domainIds = subclassId === 'death_domain' ? domainSpellIdsForLevel(level) : []

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      alert('Укажите имя персонажа.')
      return
    }
    createCharacter(trimmed, {
      race: race.trim(),
      classId,
      subclassId: subclassId || undefined,
      level,
      background: background.trim(),
      abilities,
      preparedSpellIds: preparedIds,
      cantripIds,
      domainSpellIds: domainIds,
    })
    setName('Новый герой')
    setPreparedIds([])
    setCantripIds([])
    alert('Каркас создан. Его можно сразу править в редакторе выше.')
  }

  return (
    <section className="card">
      <h3 className="section-title">Быстрое создание</h3>
      <p className="muted small">
        Заполните каркас на этой форме. После создания можно править остальные поля вручную.
      </p>
      <form className="stack gap-lg" onSubmit={submit}>
        <button type="submit" className="btn btn-primary">
          Создать каркас
        </button>
        <label className="field">
          Имя
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Раса
          <input className="input" value={race} onChange={(e) => setRace(e.target.value)} />
        </label>
        <label className="field">
          Класс
          <select
            className="input"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              const next = subclassesForClass(e.target.value)
              setSubclassId(next[0]?.id ?? '')
              setPreparedIds([])
              setCantripIds([])
            }}
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
            value={subclassId}
            onChange={(e) => setSubclassId(e.target.value)}
          >
            <option value="">Не выбран</option>
            {subclassesForClass(classId).map((s) => (
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
            value={level}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10)
              if (Number.isNaN(next)) return
              const nextLevel = Math.min(20, Math.max(1, next))
              setLevel(nextLevel)
              const maxSlot = maxSpellSlotLevel(buildSpellSlotsForCleric(nextLevel))
              setPreparedIds((ids) =>
                ids.filter((id) => {
                  const def = getSpell(id)
                  return !!def && def.level <= maxSlot
                }),
              )
            }}
          />
        </label>
        <label className="field">
          Предыстория
          <input
            className="input"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </label>
        <div className="ability-edit-grid">
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
            <label key={key} className="field">
              {ABILITY_LABELS[key]}
              <input
                type="number"
                min={1}
                max={30}
                className="input"
                value={abilities[key]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (Number.isNaN(v)) return
                  setAbilities({ ...abilities, [key]: v })
                }}
              />
            </label>
          ))}
        </div>
        <div>
          <h4 className="mini-title">Заклинания</h4>
          <SpellPreparationPicker
            classId={classId}
            level={level}
            wisdom={abilities.wis}
            preparedIds={preparedIds}
            cantripIds={cantripIds}
            domainIds={domainIds}
            onPreparedChange={setPreparedIds}
            onCantripsChange={setCantripIds}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Создать каркас
        </button>
      </form>
    </section>
  )
}
