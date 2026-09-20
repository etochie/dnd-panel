import { useState } from 'react'
import { CONDITIONS_2014 } from '../data/conditions'
import { labelList, PROFICIENCY_LABELS } from '../data/labels'
import { SKILLS_2014 } from '../data/skills'
import {
  ABILITY_LABELS,
  CLASSES,
  DRAGONBORN_ANCESTRIES,
  RACES,
  getRaceDefinition,
  subclassesForClass,
} from '../rules'
import { useCharacterStore } from '../state/CharacterStore'
import type { AbilityGenerationMethod, HpCalculationMethod } from '../types/character'
import type { CalculationBreakdown } from '../types/explain'
import { SpellPreparationPicker } from './SpellPreparationPicker'
import { NumberStepper } from './NumberStepper'
import { AbilityAssigner } from './character/AbilityAssigner'
import { CharacterAudit } from './character/CharacterAudit'
import { CharacterCreateWizard } from './character/CharacterCreateWizard'
import { LevelUpWizard } from './character/LevelUpWizard'
import { AsiPicker } from './character/AsiPicker'

export function CharacterManagePanel({
  onExplain,
}: {
  onExplain: (b: CalculationBreakdown) => void
}) {
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
  const [creating, setCreating] = useState(false)
  const [leveling, setLeveling] = useState(false)
  const [showAudit, setShowAudit] = useState(false)

  const importFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        importCharacter(await file.text())
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Ошибка импорта')
      }
    }
    input.click()
  }

  const race = getRaceDefinition(activeCharacter.raceId)
  const usingManualHp = derived.usingManualHp

  if (creating) {
    return (
      <CharacterCreateWizard
        onCancel={() => setCreating(false)}
        onCreated={(character) => {
          createCharacter(character)
          setCreating(false)
        }}
      />
    )
  }

  if (leveling) {
    return (
      <LevelUpWizard
        character={activeCharacter}
        onCancel={() => setLeveling(false)}
        onApply={(next) => {
          updateActiveCharacter(next)
          setLeveling(false)
        }}
      />
    )
  }

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Создать персонажа</h2>
        <p className="muted small">Мастер последовательно спросит уровень, класс, расу, характеристики и хиты.</p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
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
            onChange={(event) => setActiveCharacterId(event.target.value)}
          >
            {characters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || 'Без имени'}
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
            onChange={(event) => updateActiveCharacter({ name: event.target.value })}
          />
        </label>
        <label className="field">
          Раса
          <select
            className="input"
            value={activeCharacter.raceId}
            onChange={(event) => {
              const nextRace = getRaceDefinition(event.target.value)
              updateActiveCharacter({
                raceId: event.target.value,
                ancestryId: nextRace?.needsAncestry
                  ? activeCharacter.ancestryId ?? nextRace.ancestries?.[0]?.id
                  : undefined,
              })
            }}
          >
            {RACES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {race?.needsAncestry && (
          <label className="field">
            Драконья родословная
            <select
              className="input"
              value={activeCharacter.ancestryId ?? ''}
              onChange={(event) => updateActiveCharacter({ ancestryId: event.target.value })}
            >
              {DRAGONBORN_ANCESTRIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          Класс
          <select
            className="input"
            value={activeCharacter.classId}
            onChange={(event) => {
              const nextClass = event.target.value
              const first = subclassesForClass(nextClass)[0]
              updateActiveCharacter({
                classId: nextClass,
                subclassId: first?.id,
                asiChoices: [],
              })
            }}
          >
            {CLASSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Подкласс
          <select
            className="input"
            value={activeCharacter.subclassId ?? ''}
            onChange={(event) => updateActiveCharacter({ subclassId: event.target.value || undefined })}
          >
            <option value="">Не выбран</option>
            {subclassesForClass(activeCharacter.classId).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">Уровень: {activeCharacter.level}. Меняется только через повышение уровня.</p>
        <label className="field">
          Предыстория
          <input
            className="input"
            value={activeCharacter.background}
            onChange={(event) => updateActiveCharacter({ background: event.target.value })}
          />
        </label>
        <label className="field">
          Мировоззрение
          <input
            className="input"
            value={activeCharacter.alignment}
            onChange={(event) => updateActiveCharacter({ alignment: event.target.value })}
          />
        </label>

        <div className="budget-block">
          <h4 className="mini-title">Характеристики</h4>
          <label className="field">
            Способ генерации
            <select
              className="input"
              value={activeCharacter.abilityGenerationMethod}
              onChange={(event) =>
                updateActiveCharacter({
                  abilityGenerationMethod: event.target.value as AbilityGenerationMethod,
                })
              }
            >
              <option value="point_buy">Покупка очков</option>
              <option value="standard_array">Стандартный набор</option>
              <option value="manual">Ручные значения</option>
            </select>
          </label>
          <AbilityAssigner
            method={activeCharacter.abilityGenerationMethod}
            baseAbilities={activeCharacter.baseAbilities}
            parts={derived.abilityParts}
            onChangeBase={(baseAbilities) => updateActiveCharacter({ baseAbilities })}
          />
          <button type="button" className="btn-small" onClick={() => onExplain(derived.asiBreakdown)}>
            Улучшение характеристик
          </button>
        </div>

        {derived.pendingAsiLevels.length > 0 && (
          <div className="budget-block">
            <AsiPicker
              key={derived.pendingAsiLevels[0]}
              level={derived.pendingAsiLevels[0]}
              allowFeats={activeCharacter.allowFeats}
              onConfirm={(choice) =>
                updateActiveCharacter({
                  asiChoices: [
                    ...activeCharacter.asiChoices.filter((item) => item.level !== choice.level),
                    choice,
                  ],
                })
              }
            />
          </div>
        )}

        <div className="hp-edit-block">
          <h4 className="mini-title">Хиты</h4>
          <label className="field">
            Как считать хиты
            <select
              className="input"
              value={activeCharacter.hpCalculationMethod}
              onChange={(event) => {
                const hpCalculationMethod = event.target.value as HpCalculationMethod
                updateActiveCharacter((current) => ({
                  ...current,
                  hpCalculationMethod,
                  overrides:
                    hpCalculationMethod === 'manual'
                      ? { ...current.overrides, maxHp: current.overrides.maxHp ?? derived.rulesMaxHp }
                      : { ...current.overrides, maxHp: undefined },
                }))
              }}
            >
              <option value="fixed">Фиксированный вариант</option>
              <option value="rolled">Бросок</option>
              <option value="manual">Ручное значение</option>
            </select>
          </label>
          {activeCharacter.hpCalculationMethod === 'rolled' &&
            Array.from({ length: Math.max(0, activeCharacter.level - 1) }, (_, index) => index + 2).map((lvl) => (
              <label key={lvl} className="field">
                Бросок на {lvl} уровне
                <NumberStepper
                  label={`Бросок ${lvl}`}
                  value={activeCharacter.hpRolls[String(lvl)] ?? 1}
                  min={1}
                  max={derived.hitDice.die}
                  onChange={(value) =>
                    updateActiveCharacter({
                      hpRolls: { ...activeCharacter.hpRolls, [String(lvl)]: value },
                    })
                  }
                />
              </label>
            ))}
          <p>
            Максимум HP: {derived.maxHp}
            {usingManualHp ? '' : ' (расчет по правилам)'}
          </p>
          {usingManualHp && (
            <p className="warn-box">
              Используется ручное значение. Автоматический расчет: {derived.rulesMaxHp}. Ручное
              значение: {derived.maxHp}.
            </p>
          )}
          <label className="field">
            Текущие хиты
            <NumberStepper
              key={`${activeCharacter.id}-hp-${activeCharacter.currentHp}-${derived.maxHp}`}
              label="Текущие хиты"
              value={activeCharacter.currentHp}
              min={0}
              max={derived.maxHp}
              onChange={(currentHp) => updateActiveCharacter({ currentHp })}
            />
          </label>
          {usingManualHp && (
            <label className="field">
              Ручной максимум
              <NumberStepper
                label="Ручной максимум"
                value={derived.maxHp}
                min={1}
                max={999}
                onChange={(maxHp) =>
                  updateActiveCharacter({
                    hpCalculationMethod: 'manual',
                    overrides: { ...activeCharacter.overrides, maxHp },
                  })
                }
              />
            </label>
          )}
          <div className="row-actions">
            <button type="button" className="btn-small" onClick={() => onExplain(derived.maxHpBreakdown)}>
              Как считается
            </button>
            {!usingManualHp && (
              <button
                type="button"
                className="btn-small"
                onClick={() =>
                  updateActiveCharacter({
                    hpCalculationMethod: 'manual',
                    overrides: { ...activeCharacter.overrides, maxHp: derived.rulesMaxHp },
                  })
                }
              >
                Изменить вручную
              </button>
            )}
            {usingManualHp && (
              <button
                type="button"
                className="btn-small"
                onClick={() =>
                  updateActiveCharacter((current) => ({
                    ...current,
                    hpCalculationMethod: 'fixed',
                    overrides: { ...current.overrides, maxHp: undefined },
                  }))
                }
              >
                Вернуть расчет по правилам
              </button>
            )}
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setLeveling(true)}>
          Повысить уровень
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Проверить персонажа</h3>
        <button type="button" className="btn" onClick={() => setShowAudit((value) => !value)}>
          {showAudit ? 'Скрыть проверку' : 'Проверить персонажа'}
        </button>
        {showAudit && <CharacterAudit issues={derived.issues} />}
      </section>

      <section className="card">
        <h3 className="section-title">Заклинания</h3>
        <SpellPreparationPicker
          classId={activeCharacter.classId}
          level={activeCharacter.level}
          wisdom={derived.abilityScores.wis}
          preparedIds={activeCharacter.preparedSpellIds}
          cantripIds={activeCharacter.cantripIds}
          domainIds={derived.domainSpellIds}
          onPreparedChange={(preparedSpellIds) => updateActiveCharacter({ preparedSpellIds })}
          onCantripsChange={(cantripIds) => updateActiveCharacter({ cantripIds })}
        />
      </section>

      <section className="card">
        <h3 className="section-title">Владения</h3>
        <p className="muted small">
          Броня: {labelList(derived.proficiencies.armor, PROFICIENCY_LABELS)} · Оружие:{' '}
          {labelList(derived.proficiencies.weapons, PROFICIENCY_LABELS)} · Языки:{' '}
          {labelList(derived.proficiencies.languages, PROFICIENCY_LABELS)}
        </p>
        <textarea
          className="textarea"
          placeholder="Прочие владения (через запятую)"
          value={activeCharacter.extraProficiencies.other.join(', ')}
          onChange={(event) =>
            updateActiveCharacter({
              extraProficiencies: {
                ...activeCharacter.extraProficiencies,
                other: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </section>

      <section className="card">
        <h3 className="section-title">Навыки</h3>
        <div className="skills-edit">
          {SKILLS_2014.map((skill) => {
            const prof = activeCharacter.skillProficiencies.includes(skill.id)
            return (
              <label key={skill.id} className="check-row">
                <input
                  type="checkbox"
                  checked={prof}
                  onChange={() => {
                    const list = prof
                      ? activeCharacter.skillProficiencies.filter((id) => id !== skill.id)
                      : [...activeCharacter.skillProficiencies, skill.id]
                    updateActiveCharacter({ skillProficiencies: list })
                  }}
                />
                {skill.name}
              </label>
            )
          })}
        </div>
        <p className="muted small">
          Спасброски класса: {derived.saveProficiencies.map((key) => ABILITY_LABELS[key]).join(', ')}
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Состояния</h3>
        <div className="skills-edit">
          {CONDITIONS_2014.map((condition) => {
            const on = activeCharacter.conditions.includes(condition.id)
            return (
              <label key={condition.id} className="check-row" title={condition.description}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    const list = on
                      ? activeCharacter.conditions.filter((id) => id !== condition.id)
                      : [...activeCharacter.conditions, condition.id]
                    updateActiveCharacter({ conditions: list })
                  }}
                />
                {condition.name}
              </label>
            )
          })}
        </div>
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
