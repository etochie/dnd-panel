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
    editorCharacter,
    editorDirty,
    editorDerived: derived,
    setActiveCharacterId,
    updateEditorDraft,
    saveEditorDraft,
    discardEditorDraft,
    createCharacter,
    deleteCharacter,
    exportActive,
    importCharacter,
    resetData,
  } = useCharacterStore()
  const [creating, setCreating] = useState(false)
  const [leveling, setLeveling] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const saveToSheet = () => {
    saveEditorDraft()
    setSaveFlash(true)
    window.setTimeout(() => setSaveFlash(false), 2500)
  }

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

  const race = getRaceDefinition(editorCharacter.raceId)
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
        character={editorCharacter}
        onCancel={() => setLeveling(false)}
        onApply={(next) => {
          updateEditorDraft(next)
          setLeveling(false)
        }}
      />
    )
  }

  return (
    <div className="stack gap-lg">
      <section className="editor-save-bar" aria-live="polite">
        <div>
          <strong>Сохранить на вкладку Лист</strong>
          <p className="muted small">
            {saveFlash
              ? 'Сохранено. Вкладка Лист обновлена.'
              : editorDirty
                ? 'Есть несохраненные изменения.'
                : 'Изменения попадут на лист только после сохранения.'}
          </p>
        </div>
        <div className="row-actions">
          {editorDirty && (
            <button type="button" className="btn" onClick={discardEditorDraft}>
              Отменить
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={saveToSheet}>
            Сохранить
          </button>
        </div>
      </section>

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
            value={editorCharacter.id}
            onChange={(event) => {
              if (
                editorDirty &&
                !confirm('Есть несохраненные изменения. Сменить персонажа и отменить их?')
              ) {
                return
              }
              setActiveCharacterId(event.target.value)
            }}
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
            if (confirm('Удалить текущего персонажа?')) deleteCharacter(editorCharacter.id)
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
            value={editorCharacter.name}
            onChange={(event) => updateEditorDraft({ name: event.target.value })}
          />
        </label>
        <label className="field">
          Раса
          <select
            className="input"
            value={editorCharacter.raceId}
            onChange={(event) => {
              const nextRace = getRaceDefinition(event.target.value)
              updateEditorDraft({
                raceId: event.target.value,
                ancestryId: nextRace?.needsAncestry
                  ? editorCharacter.ancestryId ?? nextRace.ancestries?.[0]?.id
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
              value={editorCharacter.ancestryId ?? ''}
              onChange={(event) => updateEditorDraft({ ancestryId: event.target.value })}
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
            value={editorCharacter.classId}
            onChange={(event) => {
              const nextClass = event.target.value
              const first = subclassesForClass(nextClass)[0]
              updateEditorDraft({
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
            value={editorCharacter.subclassId ?? ''}
            onChange={(event) => updateEditorDraft({ subclassId: event.target.value || undefined })}
          >
            <option value="">Не выбран</option>
            {subclassesForClass(editorCharacter.classId).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">Уровень: {editorCharacter.level}. Меняется только через повышение уровня.</p>
        <label className="field">
          Предыстория
          <input
            className="input"
            value={editorCharacter.background}
            onChange={(event) => updateEditorDraft({ background: event.target.value })}
          />
        </label>
        <label className="field">
          Мировоззрение
          <input
            className="input"
            value={editorCharacter.alignment}
            onChange={(event) => updateEditorDraft({ alignment: event.target.value })}
          />
        </label>

        <div className="budget-block">
          <h4 className="mini-title">Характеристики</h4>
          <label className="field">
            Способ генерации
            <select
              className="input"
              value={editorCharacter.abilityGenerationMethod}
              onChange={(event) =>
                updateEditorDraft({
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
            method={editorCharacter.abilityGenerationMethod}
            baseAbilities={editorCharacter.baseAbilities}
            parts={derived.abilityParts}
            onChangeBase={(baseAbilities) => updateEditorDraft({ baseAbilities })}
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
              allowFeats={editorCharacter.allowFeats}
              onConfirm={(choice) =>
                updateEditorDraft({
                  asiChoices: [
                    ...editorCharacter.asiChoices.filter((item) => item.level !== choice.level),
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
              value={editorCharacter.hpCalculationMethod}
              onChange={(event) => {
                const hpCalculationMethod = event.target.value as HpCalculationMethod
                updateEditorDraft((current) => ({
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
          {editorCharacter.hpCalculationMethod === 'rolled' &&
            Array.from({ length: Math.max(0, editorCharacter.level - 1) }, (_, index) => index + 2).map((lvl) => (
              <label key={lvl} className="field">
                Бросок на {lvl} уровне
                <NumberStepper
                  label={`Бросок ${lvl}`}
                  value={editorCharacter.hpRolls[String(lvl)] ?? 1}
                  min={1}
                  max={derived.hitDice.die}
                  onChange={(value) =>
                    updateEditorDraft({
                      hpRolls: { ...editorCharacter.hpRolls, [String(lvl)]: value },
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
              key={`${editorCharacter.id}-hp-${editorCharacter.currentHp}-${derived.maxHp}`}
              label="Текущие хиты"
              value={editorCharacter.currentHp}
              min={0}
              max={derived.maxHp}
              onChange={(currentHp) => updateEditorDraft({ currentHp })}
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
                  updateEditorDraft({
                    hpCalculationMethod: 'manual',
                    overrides: { ...editorCharacter.overrides, maxHp },
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
                  updateEditorDraft({
                    hpCalculationMethod: 'manual',
                    overrides: { ...editorCharacter.overrides, maxHp: derived.rulesMaxHp },
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
                  updateEditorDraft((current) => ({
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
          classId={editorCharacter.classId}
          level={editorCharacter.level}
          wisdom={derived.abilityScores.wis}
          preparedIds={editorCharacter.preparedSpellIds}
          cantripIds={editorCharacter.cantripIds}
          domainIds={derived.domainSpellIds}
          onPreparedChange={(preparedSpellIds) => updateEditorDraft({ preparedSpellIds })}
          onCantripsChange={(cantripIds) => updateEditorDraft({ cantripIds })}
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
          value={editorCharacter.extraProficiencies.other.join(', ')}
          onChange={(event) =>
            updateEditorDraft({
              extraProficiencies: {
                ...editorCharacter.extraProficiencies,
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
            const prof = editorCharacter.skillProficiencies.includes(skill.id)
            return (
              <label key={skill.id} className="check-row">
                <input
                  type="checkbox"
                  checked={prof}
                  onChange={() => {
                    const list = prof
                      ? editorCharacter.skillProficiencies.filter((id) => id !== skill.id)
                      : [...editorCharacter.skillProficiencies, skill.id]
                    updateEditorDraft({ skillProficiencies: list })
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
            const on = editorCharacter.conditions.includes(condition.id)
            return (
              <label key={condition.id} className="check-row" title={condition.description}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    const list = on
                      ? editorCharacter.conditions.filter((id) => id !== condition.id)
                      : [...editorCharacter.conditions, condition.id]
                    updateEditorDraft({ conditions: list })
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
        <p className="muted small">
          Нажмите Сохранить, чтобы перенести изменения редактора на вкладку Лист и в хранилище
          браузера.
        </p>
        <div className="row-actions">
          <button type="button" className="btn btn-primary" onClick={saveToSheet}>
            Сохранить
          </button>
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
