import { useMemo, useState } from 'react'
import type {
  AbilityGenerationMethod,
  AbilityKey,
  AsiChoice,
  Character,
  HpCalculationMethod,
} from '../../types/character'
import { SKILLS_2014 } from '../../data/skills'
import { createBlankCharacter } from '../../data/testCharacter'
import {
  ABILITY_LABELS,
  CLASSES,
  DRAGONBORN_ANCESTRIES,
  RACES,
  calculateRulesMaxHp,
  deriveCharacterStats,
  earnedAsiLevels,
  formatModifier,
  getClassDefinition,
  getRaceDefinition,
  getSpellSlots,
  subclassesForClass,
} from '../../rules'
import { AbilityAssigner } from './AbilityAssigner'
import { AsiPicker } from './AsiPicker'
import { NumberStepper } from '../NumberStepper'
import { createId } from '../../utils/id'

const STEPS = [
  'Уровень',
  'Класс',
  'Подкласс',
  'Раса',
  'Родословная',
  'Характеристики',
  'Расовые бонусы',
  'Улучшение характеристик',
  'Хиты',
  'Имя и навыки',
] as const

interface Props {
  onCreated: (character: Character) => void
  onCancel: () => void
}

export function CharacterCreateWizard({ onCreated, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState(3)
  const [classId, setClassId] = useState('cleric')
  const [subclassId, setSubclassId] = useState('death_domain')
  const [raceId, setRaceId] = useState('dragonborn')
  const [ancestryId, setAncestryId] = useState('silver')
  const [method, setMethod] = useState<AbilityGenerationMethod>('point_buy')
  const [baseAbilities, setBaseAbilities] = useState<Record<AbilityKey, number>>({
    str: 8,
    dex: 8,
    con: 8,
    int: 8,
    wis: 8,
    cha: 8,
  })
  const [asiChoices, setAsiChoices] = useState<AsiChoice[]>([])
  const [allowFeats, setAllowFeats] = useState(true)
  const [hpMethod, setHpMethod] = useState<HpCalculationMethod>('fixed')
  const [hpRolls, setHpRolls] = useState<Record<string, number>>({})
  const [manualHp, setManualHp] = useState(18)
  const [skills, setSkills] = useState<string[]>([])

  const race = getRaceDefinition(raceId)
  const classDef = getClassDefinition(classId)
  const subclasses = subclassesForClass(classId)
  const neededAsi = earnedAsiLevels(classId, level)
  const pendingAsi = neededAsi.filter((asiLevel) => !asiChoices.some((choice) => choice.level === asiLevel))

  const draft = useMemo(() => {
    const character = createBlankCharacter(name.trim() || 'Новый персонаж')
    character.id = createId()
    character.level = level
    character.classId = classId
    character.subclassId = subclassId || undefined
    character.raceId = raceId
    character.ancestryId = race?.needsAncestry ? ancestryId : undefined
    character.abilityGenerationMethod = method
    character.baseAbilities = baseAbilities
    character.asiChoices = asiChoices
    character.allowFeats = allowFeats
    character.hpCalculationMethod = hpMethod
    character.hpRolls = hpRolls
    character.overrides = hpMethod === 'manual' ? { maxHp: manualHp } : {}
    character.skillProficiencies = skills
    character.spellSlots = getSpellSlots(classId, level)
    character.hitDiceRemaining = level
    return character
  }, [
    allowFeats,
    ancestryId,
    asiChoices,
    baseAbilities,
    classId,
    hpMethod,
    hpRolls,
    level,
    manualHp,
    method,
    name,
    race?.needsAncestry,
    raceId,
    skills,
    subclassId,
  ])

  const derived = useMemo(() => deriveCharacterStats(draft), [draft])
  const rulesHp = calculateRulesMaxHp(draft).value

  const visibleSteps = STEPS.map((label, index) => ({ label, index })).filter((item) => {
    if (item.index === 4 && !race?.needsAncestry) return false
    if (item.index === 7 && neededAsi.length === 0) return false
    return true
  })
  const currentMeta = visibleSteps.find((item) => item.index === step) ?? visibleSteps[0]
  const currentPos = visibleSteps.findIndex((item) => item.index === step)

  const canNext = (): boolean => {
    if (step === 2 && subclasses.length > 0 && !subclassId) return false
    if (step === 4 && race?.needsAncestry && !ancestryId) return false
    if (step === 5 && method === 'point_buy' && derived.issues.some((item) => item.id.startsWith('point-buy-over'))) {
      return false
    }
    if (step === 7 && pendingAsi.length > 0) return false
    if (step === 8 && hpMethod === 'rolled') {
      for (let lvl = 2; lvl <= level; lvl += 1) {
        if (!hpRolls[String(lvl)]) return false
      }
    }
    if (step === 9 && !name.trim()) return false
    return true
  }

  const goNext = () => {
    const next = visibleSteps[currentPos + 1]
    if (next) setStep(next.index)
  }
  const goBack = () => {
    const prev = visibleSteps[currentPos - 1]
    if (prev) setStep(prev.index)
  }

  const finish = () => {
    const character = { ...draft, name: name.trim() }
    character.currentHp = hpMethod === 'manual' ? manualHp : rulesHp
    onCreated(character)
  }

  return (
    <div className="wizard">
      <header className="wizard-head">
        <p className="muted small">
          Шаг {currentPos + 1} из {visibleSteps.length}
        </p>
        <h2 className="section-title">{currentMeta.label}</h2>
      </header>

      {step === 0 && (
        <label className="field">
          Уровень
          <NumberStepper label="Уровень" value={level} min={1} max={20} onChange={setLevel} />
        </label>
      )}

      {step === 1 && (
        <div className="choice-grid">
          {CLASSES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`choice-card ${classId === item.id ? 'active' : ''}`}
              onClick={() => {
                setClassId(item.id)
                const first = subclassesForClass(item.id)[0]
                setSubclassId(first?.id ?? '')
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="choice-grid">
          {subclasses.length === 0 ? (
            <p className="muted">Для этого класса подкласс пока не задан.</p>
          ) : (
            subclasses.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`choice-card ${subclassId === item.id ? 'active' : ''}`}
                onClick={() => setSubclassId(item.id)}
              >
                {item.name}
              </button>
            ))
          )}
        </div>
      )}

      {step === 3 && (
        <div className="choice-grid">
          {RACES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`choice-card ${raceId === item.id ? 'active' : ''}`}
              onClick={() => setRaceId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="choice-grid">
          {DRAGONBORN_ANCESTRIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`choice-card ${ancestryId === item.id ? 'active' : ''}`}
              onClick={() => setAncestryId(item.id)}
            >
              <strong>{item.name}</strong>
              <span className="muted small">{item.damageType}</span>
            </button>
          ))}
        </div>
      )}

      {step === 5 && (
        <>
          <div className="choice-grid">
            <button
              type="button"
              className={`choice-card ${method === 'standard_array' ? 'active' : ''}`}
              onClick={() => {
                setMethod('standard_array')
                setBaseAbilities({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
              }}
            >
              Стандартный набор
            </button>
            <button
              type="button"
              className={`choice-card ${method === 'point_buy' ? 'active' : ''}`}
              onClick={() => {
                setMethod('point_buy')
                setBaseAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
              }}
            >
              Покупка очков
            </button>
            <button
              type="button"
              className={`choice-card ${method === 'manual' ? 'active' : ''}`}
              onClick={() => setMethod('manual')}
            >
              Ручные значения
            </button>
          </div>
          <AbilityAssigner
            method={method}
            baseAbilities={baseAbilities}
            parts={derived.abilityParts}
            onChangeBase={setBaseAbilities}
            showTotals={false}
          />
        </>
      )}

      {step === 6 && (
        <div className="ability-edit-grid">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
            const part = derived.abilityParts[key]
            return (
              <div key={key} className="ability-card">
                <strong>{ABILITY_LABELS[key]}</strong>
                <ul className="ability-parts">
                  <li>Базовое значение: {part.base}</li>
                  <li>Расовый бонус: {part.racial ? formatModifier(part.racial) : 'нет'}</li>
                  <li>Итог: {part.total}</li>
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {step === 7 && (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              checked={allowFeats}
              onChange={(event) => setAllowFeats(event.target.checked)}
            />
            Разрешить черты вместо улучшения характеристик
          </label>
          {pendingAsi.length === 0 ? (
            <p className="muted">Все улучшения характеристик выбраны.</p>
          ) : (
            <AsiPicker
              key={pendingAsi[0]}
              level={pendingAsi[0]}
              allowFeats={allowFeats}
              onConfirm={(choice) => setAsiChoices((list) => [...list.filter((item) => item.level !== choice.level), choice])}
            />
          )}
        </>
      )}

      {step === 8 && (
        <>
          <div className="choice-grid">
            <button
              type="button"
              className={`choice-card ${hpMethod === 'fixed' ? 'active' : ''}`}
              onClick={() => setHpMethod('fixed')}
            >
              Фиксированный вариант
            </button>
            <button
              type="button"
              className={`choice-card ${hpMethod === 'rolled' ? 'active' : ''}`}
              onClick={() => {
                setHpMethod('rolled')
                setHpRolls((current) => {
                  const next = { ...current }
                  for (let lvl = 2; lvl <= level; lvl += 1) {
                    if (next[String(lvl)] == null) next[String(lvl)] = Math.floor((classDef?.hitDie ?? 8) / 2) + 1
                  }
                  return next
                })
              }}
            >
              Бросок
            </button>
            <button
              type="button"
              className={`choice-card ${hpMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setHpMethod('manual')}
            >
              Ручное значение
            </button>
          </div>
          {hpMethod === 'fixed' && (
            <p>Максимум хитов по правилам: {rulesHp}</p>
          )}
          {hpMethod === 'rolled' && (
            <div>
              <p className="muted small">
                Приложение не бросает кубик. Введите результат d{classDef?.hitDie ?? 8} для каждого уровня после первого.
              </p>
              {Array.from({ length: Math.max(0, level - 1) }, (_, index) => index + 2).map((lvl) => (
                <label key={lvl} className="field">
                  {lvl} уровень
                  <NumberStepper
                    label={`${lvl} уровень`}
                    value={hpRolls[String(lvl)] ?? 1}
                    min={1}
                    max={classDef?.hitDie ?? 8}
                    onChange={(value) => setHpRolls((current) => ({ ...current, [String(lvl)]: value }))}
                  />
                </label>
              ))}
              <p>Максимум хитов: {rulesHp}</p>
            </div>
          )}
          {hpMethod === 'manual' && (
            <>
              <p className="warn-box">
                Это ручное значение и оно не соответствует автоматическому расчету правил.
                Автоматический расчет: {rulesHp}.
              </p>
              <label className="field">
                Максимум хитов
                <NumberStepper label="Максимум хитов" value={manualHp} min={1} max={999} onChange={setManualHp} />
              </label>
            </>
          )}
        </>
      )}

      {step === 9 && (
        <>
          <label className="field">
            Имя
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <h4 className="mini-title">Навыки класса</h4>
          <p className="muted small">
            {classDef?.name}: выберите {classDef?.skillChoices.count ?? 0} из списка класса.
          </p>
          <div className="skills-edit">
            {(classDef?.skillChoices.options ?? []).map((id) => {
              const skill = SKILLS_2014.find((item) => item.id === id)
              const checked = skills.includes(id)
              return (
                <label key={id} className="check-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        setSkills(skills.filter((item) => item !== id))
                        return
                      }
                      const limit = classDef?.skillChoices.count ?? 0
                      if (skills.length >= limit) return
                      setSkills([...skills, id])
                    }}
                  />
                  {skill?.name ?? id}
                </label>
              )
            })}
          </div>
        </>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={currentPos === 0 ? onCancel : goBack}>
          {currentPos === 0 ? 'Отмена' : 'Назад'}
        </button>
        {currentPos < visibleSteps.length - 1 ? (
          <button type="button" className="btn btn-primary" disabled={!canNext()} onClick={goNext}>
            Дальше
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!canNext()} onClick={finish}>
            Создать персонажа
          </button>
        )}
      </div>
    </div>
  )
}
