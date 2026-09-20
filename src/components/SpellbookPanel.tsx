import { useState } from 'react'
import { DEATH_DOMAIN_FEATURES, DEATH_DOMAIN_SPELLS } from '../data/deathDomain'
import { getSpell, getSpellsByIds } from '../data/spells'
import { formatRangeFeet } from '../data/distances'
import { useCharacterStore } from '../state/CharacterStore'
import { MechanicHint, RulesExplanation } from './RulesExplanation'
import { MECHANIC_HINTS } from '../data/combatActions'
import { SpellPreparationPicker } from './SpellPreparationPicker'
import type { CalculationBreakdown } from '../types/explain'

export function SpellbookPanel() {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const [limitBreakdown, setLimitBreakdown] = useState<CalculationBreakdown | null>(null)

  const domainIds = activeCharacter.domainSpellIds
  const domainSpells = getSpellsByIds(domainIds)
  const prepared = getSpellsByIds(activeCharacter.preparedSpellIds)
  const known = getSpellsByIds(activeCharacter.knownSpellIds)
  const cantrips = getSpellsByIds(activeCharacter.cantripIds)

  const restoreSlots = () => {
    if (!confirm('Восстановить все ячейки до максимума?')) return
    updateActiveCharacter((c) => ({
      ...c,
      spellSlots: c.spellSlots.map((s) => ({ ...s, current: s.max })),
    }))
  }

  const castSpell = (spellId: string) => {
    const def = getSpell(spellId)
    if (!def) return
    if (def.concentration && activeCharacter.concentration) {
      if (
        !confirm(
          'Вы уже концентрируетесь на другом заклинании. Новое заклинание прекратит текущую концентрацию. Продолжить?',
        )
      ) {
        return
      }
    }
    if (def.level > 0) {
      const slot = activeCharacter.spellSlots.find((s) => s.level === def.level)
      if (!slot || slot.current <= 0) {
        alert('Нет доступной ячейки этого уровня.')
        return
      }
    }
    updateActiveCharacter((c) => {
      let spellSlots = c.spellSlots
      if (def.level > 0) {
        spellSlots = c.spellSlots.map((s) =>
          s.level === def.level && s.current > 0
            ? { ...s, current: s.current - 1 }
            : s,
        )
      }
      return {
        ...c,
        spellSlots,
        concentration: def.concentration
          ? {
              spellId: def.id,
              name: def.name,
              duration: def.duration,
              summary: def.effect,
            }
          : c.concentration,
      }
    })
  }

  const useSlot = (level: number) => {
    updateActiveCharacter((c) => ({
      ...c,
      spellSlots: c.spellSlots.map((s) =>
        s.level === level && s.current > 0 ? { ...s, current: s.current - 1 } : s,
      ),
    }))
  }

  const domainFeatures = DEATH_DOMAIN_FEATURES.filter(
    (f) => f.level <= activeCharacter.level,
  )

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Ячейки заклинаний</h2>
        {activeCharacter.spellSlots.map((s) => (
          <div key={s.level} className="slot-line">
            <span>
              {s.level} уровень: {s.current} / {s.max}
            </span>
            <div className="slot-dots" aria-hidden>
              {Array.from({ length: s.max }).map((_, i) => (
                <span key={i} className={`dot ${i < s.current ? 'on' : ''}`} />
              ))}
            </div>
            <button
              type="button"
              className="btn-small"
              disabled={s.current <= 0}
              onClick={() => useSlot(s.level)}
            >
              Использовать ячейку
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={restoreSlots}>
          Восстановить ячейки
        </button>
      </section>

      {activeCharacter.concentration && (
        <section className="card concentration">
          <h3 className="section-title">Концентрация</h3>
          <p>
            <strong>{activeCharacter.concentration.name}</strong>
          </p>
          <p className="muted">{activeCharacter.concentration.duration}</p>
          <p>{activeCharacter.concentration.summary}</p>
          <MechanicHint
            term="Концентрация"
            text={MECHANIC_HINTS.concentration}
            onShow={(t, x) => alert(`${t}: ${x}`)}
          />
          <button
            type="button"
            className="btn"
            onClick={() => updateActiveCharacter({ concentration: null })}
          >
            Прекратить концентрацию
          </button>
        </section>
      )}

      <section className="card">
        <h2 className="section-title">Подготовка заклинаний</h2>
        <SpellPreparationPicker
          classId={activeCharacter.classId}
          level={activeCharacter.level}
          wisdom={activeCharacter.abilities.wis}
          preparedIds={activeCharacter.preparedSpellIds}
          cantripIds={activeCharacter.cantripIds}
          domainIds={activeCharacter.domainSpellIds}
          onPreparedChange={(preparedSpellIds) => updateActiveCharacter({ preparedSpellIds })}
          onCantripsChange={(cantripIds) => updateActiveCharacter({ cantripIds })}
          onExplainLimit={() => setLimitBreakdown(derived.preparedSpellLimitBreakdown)}
        />
      </section>

      <section className="card domain-block">
        <h2 className="section-title">Заклинания Домена Смерти</h2>
        <p className="muted small">
          Всегда подготовлены по уровню домена (2014). Уровни получения:{' '}
          {DEATH_DOMAIN_SPELLS.map((e) => `${e.characterLevel}`).join(', ')}
        </p>
        {domainSpells.length === 0 ? (
          <p className="muted">Доменные заклинания не заданы.</p>
        ) : (
          domainSpells.map((s) => (
            <SpellCard key={s.id} spell={s} onCast={() => castSpell(s.id)} domain />
          ))
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Способности Домена Смерти</h3>
        {domainFeatures.map((f) => (
          <article key={f.id} className="feature-block">
            <h4>
              {f.name} <span className="muted">(ур. {f.level})</span>
            </h4>
            <p>{f.description}</p>
            <ul className="muted small">
              <li>Использование: {f.usage}</li>
              <li>Тип: {f.actionType}</li>
              <li>Ограничения: {f.limits}</li>
            </ul>
          </article>
        ))}
      </section>

      <SpellList title="Заговоры" spells={cantrips} onCast={castSpell} />
      <SpellList title="Подготовленные" spells={prepared} onCast={castSpell} />
      <SpellList title="Известные" spells={known} onCast={castSpell} />
      <RulesExplanation breakdown={limitBreakdown} onClose={() => setLimitBreakdown(null)} />
    </div>
  )
}

function SpellList({
  title,
  spells,
  onCast,
}: {
  title: string
  spells: ReturnType<typeof getSpellsByIds>
  onCast: (id: string) => void
}) {
  return (
    <section className="card">
      <h3 className="section-title">{title}</h3>
      {spells.length === 0 ? (
        <p className="muted">Список пуст. Выберите заклинания в блоке подготовки выше.</p>
      ) : (
        spells.map((s) => <SpellCard key={s.id} spell={s} onCast={() => onCast(s.id)} />)
      )}
    </section>
  )
}

function SpellCard({
  spell,
  onCast,
  domain,
}: {
  spell: NonNullable<ReturnType<typeof getSpell>>
  onCast: () => void
  domain?: boolean
}) {
  return (
    <article className={`spell-card ${domain ? 'domain' : ''}`}>
      <header>
        <strong>{spell.name}</strong>
        <span className="chip">{spell.level === 0 ? 'заговор' : `${spell.level} ур.`}</span>
      </header>
      <p className="muted small">
        {spell.school} · {spell.castingTime} · {spell.rangeText ?? formatRangeFeet(spell.rangeFeet)} ·{' '}
        {spell.concentration ? 'концентрация' : 'без концентрации'}
      </p>
      <p>{spell.effect}</p>
      {spell.higherLevels && <p className="muted small">На высоких уровнях: {spell.higherLevels}</p>}
      <button type="button" className="btn-small" onClick={onCast}>
        Наложить
      </button>
    </article>
  )
}
