import { useCharacterStore } from '../state/CharacterStore'
import { StatButton } from './StatButton'
import type { CalculationBreakdown } from '../types/explain'
import { CONDITIONS_2014 } from '../data/conditions'
import { getClassDefinition } from '../data/classes'
import { RESOURCE_LABELS } from '../data/labels'
import { ABILITY_LABELS, formatModifier } from '../engine/abilities'

interface Props {
  onExplain: (b: CalculationBreakdown) => void
}

export function CharacterSheet({ onExplain }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const maxHp = derived.maxHp
  const className = getClassDefinition(activeCharacter.classId)?.name ?? activeCharacter.classId

  const applyDamage = () => {
    const raw = prompt('Урон (число):', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((c) => {
      let temp = c.tempHp
      let hp = c.currentHp
      let remaining = n
      if (temp > 0) {
        const used = Math.min(temp, remaining)
        temp -= used
        remaining -= used
      }
      hp = Math.max(0, hp - remaining)
      return { ...c, currentHp: hp, tempHp: temp }
    })
  }

  const applyHeal = () => {
    const raw = prompt('Лечение (число):', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((c) => ({
      ...c,
      currentHp: Math.min(maxHp, c.currentHp + n),
    }))
  }

  const addTempHp = () => {
    const raw = prompt('Временные хиты:', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((c) => ({ ...c, tempHp: c.tempHp + n }))
  }

  return (
    <div className="stack gap-lg">
      <section className="card hero-card">
        <div className="hero-title">
          <h2>{activeCharacter.name}</h2>
          <p className="muted">
            {activeCharacter.race} · {activeCharacter.level} ур. · {className}
            {activeCharacter.subclassId === 'death_domain' ? ' · Домен Смерти' : ''}
          </p>
        </div>
        <div className="hp-block">
          <div className="hp-numbers">
            <span className="hp-label">Хиты</span>
            <span className="hp-value">
              {activeCharacter.currentHp} / {maxHp}
            </span>
            {activeCharacter.tempHp > 0 && (
              <span className="temp-hp">+{activeCharacter.tempHp} врем.</span>
            )}
          </div>
          <div className="hp-actions">
            <button type="button" className="btn" onClick={applyDamage}>
              Получить урон
            </button>
            <button type="button" className="btn" onClick={applyHeal}>
              Получить лечение
            </button>
            <button type="button" className="btn" onClick={addTempHp}>
              Временные хиты
            </button>
          </div>
        </div>
      </section>

      <section className="grid-stats">
        <StatButton
          label="КД"
          value={String(derived.ac)}
          breakdown={derived.acBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Инициатива"
          value={formatModifier(derived.initiative)}
          breakdown={derived.initiativeBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Скорость"
          value={`${derived.speed} м`}
          breakdown={{
            title: 'Скорость',
            result: `${derived.speed} м`,
            lines: [
              activeCharacter.speedOverride
                ? `Задано для персонажа: ${derived.speed} м (30 футов = 9 м по таблице 2014).`
                : 'Скорость не задана - используется значение по умолчанию 9 м.',
            ],
          }}
          onExplain={onExplain}
        />
        <StatButton
          label="Мастерство"
          value={formatModifier(derived.proficiencyBonus)}
          breakdown={derived.proficiencyBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Сл заклинаний"
          value={String(derived.spellSaveDc)}
          breakdown={derived.spellSaveDcBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Атака заклин."
          value={formatModifier(derived.spellAttackBonus)}
          breakdown={derived.spellAttackBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Пасс. восприятие"
          value={String(derived.passivePerception)}
          breakdown={derived.passivePerceptionBreakdown}
          onExplain={onExplain}
        />
      </section>

      <section className="card">
        <h3 className="section-title">Характеристики</h3>
        <div className="ability-grid">
          {(Object.keys(ABILITY_LABELS) as (keyof typeof ABILITY_LABELS)[]).map((key) => (
            <StatButton
              key={key}
              label={ABILITY_LABELS[key]}
              value={formatModifier(derived.abilityModifiers[key])}
              breakdown={derived.abilityBreakdowns[key]}
              onExplain={onExplain}
            />
          ))}
        </div>
        <p className="muted small">
          Базовые значения:{' '}
          {Object.entries(activeCharacter.abilities)
            .map(([k, v]) => `${ABILITY_LABELS[k as keyof typeof ABILITY_LABELS]} ${v}`)
            .join(' · ')}
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Ресурсы</h3>
        {activeCharacter.resources.length === 0 ? (
          <p className="muted">Нет отслеживаемых ресурсов.</p>
        ) : (
          activeCharacter.resources.map((r) => (
            <p key={r.id}>
              {RESOURCE_LABELS[r.id] ?? r.name}: {r.current} / {r.max}
            </p>
          ))
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Ячейки (кратко)</h3>
        <div className="slot-row">
          {activeCharacter.spellSlots.map((s) => (
            <span key={s.level} className="chip">
              {s.level} ур.: {s.current} / {s.max}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Состояние хода</h3>
        <p className="muted">
          Действие: {activeCharacter.combat.actionUsed ? 'использовано' : 'доступно'} · Бонус:{' '}
          {activeCharacter.combat.bonusActionUsed ? 'использовано' : 'доступно'} · Реакция:{' '}
          {activeCharacter.combat.reactionUsed ? 'использована' : 'доступна'} · Перемещение:{' '}
          {activeCharacter.combat.movementRemaining} м
        </p>
        {activeCharacter.concentration && (
          <p className="concentration-banner">
            Концентрация: {activeCharacter.concentration.name}
          </p>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Навыки</h3>
        <div className="skills-compact">
          {derived.skills.map((s) => (
            <button
              key={s.id}
              type="button"
              className="skill-chip"
              onClick={() => onExplain(s.breakdown)}
            >
              <span>{s.name}</span>
              <strong>{s.bonus >= 0 ? `+${s.bonus}` : s.bonus}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Спасброски</h3>
        <div className="grid-stats">
          {derived.saves.map((s) => (
            <StatButton
              key={s.key}
              label={s.label}
              value={s.bonus >= 0 ? `+${s.bonus}` : String(s.bonus)}
              breakdown={s.breakdown}
              onExplain={onExplain}
            />
          ))}
        </div>
      </section>

      {activeCharacter.conditions.length > 0 && (
        <section className="card">
          <h3 className="section-title">Состояния</h3>
          <div className="chip-row">
            {activeCharacter.conditions.map((id) => (
              <span key={id} className="chip">
                {CONDITIONS_2014.find((c) => c.id === id)?.name ?? id}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
