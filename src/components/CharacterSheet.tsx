import { useCharacterStore } from '../state/CharacterStore'
import { StatButton } from './StatButton'
import type { CalculationBreakdown } from '../types/explain'
import { CONDITIONS_2014 } from '../data/conditions'
import { RESOURCE_LABELS } from '../data/labels'
import { ABILITY_LABELS, equipShieldOnCharacter, formatModifier, unequipShieldOnCharacter } from '../rules'

interface Props {
  onExplain: (b: CalculationBreakdown) => void
}

export function CharacterSheet({ onExplain }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const maxHp = derived.maxHp

  const applyDamage = () => {
    const raw = prompt('Урон (число):', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((character) => {
      let temp = character.tempHp
      let hp = character.currentHp
      let remaining = n
      if (temp > 0) {
        const used = Math.min(temp, remaining)
        temp -= used
        remaining -= used
      }
      hp = Math.max(0, hp - remaining)
      return { ...character, currentHp: hp, tempHp: temp }
    })
  }

  const applyHeal = () => {
    const raw = prompt('Лечение (число):', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((character) => ({
      ...character,
      currentHp: Math.min(maxHp, character.currentHp + n),
    }))
  }

  const addTempHp = () => {
    const raw = prompt('Временные хиты:', '1')
    if (raw == null) return
    const n = parseInt(raw, 10)
    if (Number.isNaN(n) || n < 0) return
    updateActiveCharacter((character) => ({ ...character, tempHp: character.tempHp + n }))
  }

  const identity = [
    derived.raceName,
    derived.ancestryName,
    `${activeCharacter.level} ур.`,
    derived.className,
    derived.subclassName,
  ]
    .filter(Boolean)
    .join(' · ')

  const acWithShield =
    derived.shieldBonusApplied > 0
      ? derived.acWithoutShield + derived.shieldBonusApplied
      : derived.acWithoutShield

  return (
    <div className="stack gap-lg">
      <section className="card hero-card">
        <div className="hero-title">
          <h2>{activeCharacter.name}</h2>
          <p className="muted">{identity}</p>
        </div>
        <div className="hp-block">
          <div className="hp-numbers">
            <span className="hp-label">Хиты</span>
            <button
              type="button"
              className="hp-value hp-value-btn"
              onClick={() => onExplain(derived.maxHpBreakdown)}
            >
              {activeCharacter.currentHp} / {maxHp}
            </button>
            {activeCharacter.tempHp > 0 && (
              <span className="temp-hp">+{activeCharacter.tempHp} врем.</span>
            )}
          </div>
          <button type="button" className="link-hint" onClick={() => onExplain(derived.maxHpBreakdown)}>
            Как считается?
          </button>
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
        <StatButton label="КД" value={String(derived.ac)} breakdown={derived.acBreakdown} onExplain={onExplain} />
        <StatButton
          label="Инициатива"
          value={formatModifier(derived.initiative)}
          breakdown={derived.initiativeBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Скорость"
          value={`${derived.speed} м`}
          breakdown={derived.speedBreakdown}
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
        <StatButton
          label="Кости хитов"
          value={derived.hitDice.label}
          breakdown={derived.hitDiceBreakdown}
          onExplain={onExplain}
        />
        <StatButton
          label="Улучшение характеристик"
          value={derived.hasAsiNow ? 'Да' : 'Нет'}
          breakdown={derived.asiBreakdown}
          onExplain={onExplain}
        />
      </section>

      <section className="card ac-shield-block">
        <h3 className="section-title">Класс брони и щит</h3>
        <p>
          <strong>КД: {derived.ac}</strong>
        </p>
        <p className="muted small">КД без щита: {derived.acWithoutShield}</p>
        {derived.shieldEquipped && derived.shieldProficient && derived.shieldBonusApplied > 0 && (
          <>
            <p className="muted small">Щит: +{derived.shieldBonusApplied}</p>
            <p className="muted small">КД со щитом: {acWithShield}</p>
          </>
        )}
        {derived.shieldEquipped && !derived.shieldProficient && (
          <p className="warn-box small">Щит надет, но нет владения - бонус к КД не применяется.</p>
        )}
        <div className="row-actions">
          <button
            type="button"
            className="btn-small"
            disabled={derived.shieldEquipped}
            onClick={() => updateActiveCharacter((c) => equipShieldOnCharacter(c))}
          >
            Надеть щит
          </button>
          <button
            type="button"
            className="btn-small"
            disabled={!derived.shieldEquipped}
            onClick={() => updateActiveCharacter((c) => unequipShieldOnCharacter(c))}
          >
            Снять щит
          </button>
          <button type="button" className="btn-small" onClick={() => onExplain(derived.acBreakdown)}>
            Как считается?
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Характеристики</h3>
        <div className="ability-grid">
          {(Object.keys(ABILITY_LABELS) as (keyof typeof ABILITY_LABELS)[]).map((key) => (
            <StatButton
              key={key}
              label={ABILITY_LABELS[key]}
              value={`${derived.abilityScores[key]} (${formatModifier(derived.abilityModifiers[key])})`}
              breakdown={derived.abilityBreakdowns[key]}
              onExplain={onExplain}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Ресурсы</h3>
        {derived.resources.length === 0 ? (
          <p className="muted">Нет отслеживаемых ресурсов.</p>
        ) : (
          derived.resources.map((resource) => (
            <p key={resource.id}>
              {RESOURCE_LABELS[resource.id] ?? resource.name}: {resource.current} / {resource.max}
            </p>
          ))
        )}
      </section>

      {derived.breath && (
        <section className="card">
          <h3 className="section-title">Драконье дыхание</h3>
          <button
            type="button"
            className="link-hint"
            onClick={() =>
              onExplain({
                title: 'Драконье дыхание',
                result: derived.breath?.damage ?? '',
                lines: derived.breath?.breakdownLines ?? [],
              })
            }
          >
            Как считается?
          </button>
          <ul>
            <li>Тип: {derived.breath.damageType}</li>
            <li>Область: {derived.breath.area}</li>
            <li>
              Спасбросок: {derived.breath.save}, Сл {derived.breath.saveDc}
            </li>
            <li>Урон: {derived.breath.damage}</li>
            <li>Восстановление: {derived.breath.recharge}</li>
          </ul>
        </section>
      )}

      <section className="card">
        <h3 className="section-title">Навыки</h3>
        <div className="skills-compact">
          {derived.skills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className="skill-chip skill-chip-detailed"
              onClick={() => onExplain(skill.breakdown)}
            >
              <span className="skill-chip-main">
                <span>{skill.name}</span>
                <span className="muted small">{skill.ability}</span>
              </span>
              <span className="skill-chip-meta">
                {skill.proficient && <span className="skill-prof-dot" title="Владение">●</span>}
                <strong>{skill.bonus >= 0 ? `+${skill.bonus}` : skill.bonus}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Спасброски</h3>
        <div className="grid-stats">
          {derived.saves.map((save) => (
            <StatButton
              key={save.key}
              label={save.label}
              value={save.bonus >= 0 ? `+${save.bonus}` : String(save.bonus)}
              breakdown={save.breakdown}
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
                {CONDITIONS_2014.find((item) => item.id === id)?.name ?? id}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
