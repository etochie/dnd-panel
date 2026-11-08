import { useState } from 'react'
import { DEATH_DOMAIN_FEATURES, DEATH_DOMAIN_SPELLS } from '../data/deathDomain'
import { getDestroyUndeadCr } from '../rules/classes'
import { getReaperCantripId } from '../rules/classes/deathDomain'
import {
  applyHarnessDivinePower,
  CHANNEL_RESOURCE_ID,
  HARNESS_RESOURCE_ID,
  harnessMaxSlotLevelForCharacter,
  harnessRestorableSlotLevels,
} from '../rules/classes/harnessDivinePower'
import { getSpell, getSpellsByIds } from '../data/spells'
import { formatRangeFeet } from '../data/distances'
import { useCharacterStore } from '../state/CharacterStore'
import { useTableMode } from '../state/TableMode'
import { MechanicHint, RulesExplanation } from './RulesExplanation'
import { MECHANIC_HINTS } from '../data/combatActions'
import { SpellPreparationPicker } from './SpellPreparationPicker'
import type { CalculationBreakdown } from '../types/explain'
import type { Character } from '../types/character'

interface Props {
  onMechanic: (title: string, text: string) => void
}

export function SpellbookPanel({ onMechanic }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const { mode, openConfirm, openNotice, openChoice } = useTableMode()
  const newTable = mode === 'new'
  const [limitBreakdown, setLimitBreakdown] = useState<CalculationBreakdown | null>(null)
  const [harnessSlotLevel, setHarnessSlotLevel] = useState('')

  const domainIds = derived.domainSpellIds
  const domainSpells = getSpellsByIds(domainIds)
  const prepared = getSpellsByIds(activeCharacter.preparedSpellIds)
  const known = getSpellsByIds(activeCharacter.knownSpellIds)
  const reaperCantripId = getReaperCantripId(activeCharacter)
  const cantrips = getSpellsByIds(
    reaperCantripId && !activeCharacter.cantripIds.includes(reaperCantripId)
      ? [...activeCharacter.cantripIds, reaperCantripId]
      : activeCharacter.cantripIds,
  )
  const cantripTags: Record<string, string> = reaperCantripId ? { [reaperCantripId]: 'Жнец' } : {}

  const restoreSlots = () => {
    const apply = () =>
      updateActiveCharacter((c) => ({
        ...c,
        spellSlots: c.spellSlots.map((s) => ({ ...s, current: s.max })),
      }))
    if (!newTable) {
      if (!confirm('Восстановить все ячейки до максимума?')) return
      apply()
      return
    }
    openConfirm({
      title: 'Ячейки заклинаний',
      text: 'Восстановить все ячейки до максимума?',
      confirmLabel: 'Восстановить',
      onConfirm: apply,
    })
  }

  const commitCast = (spellId: string, slotLevel: number | null) => {
    const def = getSpell(spellId)
    if (!def) return
    updateActiveCharacter((c) => applyCast(c, def, slotLevel))
  }

  const castSpell = (spellId: string) => {
    const def = getSpell(spellId)
    if (!def) return
    if (!newTable) {
      castSpellClassic(spellId)
      return
    }
    const concentrationText =
      def.concentration && activeCharacter.concentration
        ? 'Вы уже концентрируетесь на другом заклинании. Новое заклинание прекратит текущую концентрацию. Продолжить?'
        : undefined
    if (def.level === 0) {
      if (!concentrationText) {
        commitCast(spellId, null)
        return
      }
      openConfirm({
        title: def.name,
        text: concentrationText,
        confirmLabel: 'Наложить',
        onConfirm: () => commitCast(spellId, null),
      })
      return
    }
    const slots = activeCharacter.spellSlots
      .filter((slot) => slot.level >= def.level && slot.max > 0)
      .slice()
      .sort((a, b) => a.level - b.level)
    const usable = slots.filter((slot) => slot.current > 0)
    if (usable.length === 0) {
      openNotice({ title: def.name, text: 'Нет доступной ячейки этого уровня.' })
      return
    }
    const canUpcast = slots.some((slot) => slot.level > def.level)
    if (!canUpcast && !concentrationText) {
      commitCast(spellId, def.level)
      return
    }
    if (!canUpcast) {
      openConfirm({
        title: def.name,
        text: concentrationText ?? 'Наложить заклинание?',
        confirmLabel: 'Наложить',
        onConfirm: () => commitCast(spellId, def.level),
      })
      return
    }
    openChoice({
      title: def.name,
      text: concentrationText,
      hint: def.higherLevels ? `На высоких уровнях: ${def.higherLevels}` : undefined,
      options: slots.map((slot) => ({
        id: String(slot.level),
        disabled: slot.current <= 0,
        label:
          slot.current <= 0
            ? `${slot.level} круг, ячеек не осталось`
            : slot.level === def.level
              ? `${slot.level} круг, осталось ${slot.current}`
              : `${slot.level} круг (выше), осталось ${slot.current}`,
      })),
      onChoose: (id) => commitCast(spellId, Number(id)),
    })
  }

  const castSpellClassic = (spellId: string) => {
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
    commitCast(spellId, def.level > 0 ? def.level : null)
  }

  const useSlot = (level: number) => {
    updateActiveCharacter((c) => ({
      ...c,
      spellSlots: c.spellSlots.map((s) =>
        s.level === level && s.current > 0 ? { ...s, current: s.current - 1 } : s,
      ),
    }))
  }

  const channelResource = derived.resources.find((r) => r.id === CHANNEL_RESOURCE_ID)
  const harnessResource = derived.resources.find((r) => r.id === HARNESS_RESOURCE_ID)
  const channelOptions = [...derived.features.classFeatures, ...derived.features.subclassFeatures].filter(
    (f) => f.resourceId === CHANNEL_RESOURCE_ID || f.resourceId === HARNESS_RESOURCE_ID,
  )
  const destroyUndead = derived.features.classFeatures.find((f) => f.id === 'cleric_destroy_undead')
  const destroyCr = getDestroyUndeadCr(activeCharacter.classId, activeCharacter.level)
  const restorableLevels = harnessRestorableSlotLevels(activeCharacter)
  const harnessMaxLevel = harnessMaxSlotLevelForCharacter(activeCharacter)
  const selectedHarnessLevel = restorableLevels.includes(Number(harnessSlotLevel))
    ? Number(harnessSlotLevel)
    : (restorableLevels[0] ?? 0)

  const tell = (title: string, text: string) => {
    if (newTable) openNotice({ title, text })
    else alert(text)
  }

  const ask = (title: string, text: string, confirmLabel: string, onYes: () => void) => {
    if (!newTable) {
      if (!confirm(text)) return
      onYes()
      return
    }
    openConfirm({ title, text, confirmLabel, onConfirm: onYes })
  }

  const useChannelDivinity = (featureName: string) => {
    if (!channelResource || channelResource.current <= 0) {
      tell(featureName, 'Нет доступных использований Божественного канала.')
      return
    }
    ask(
      featureName,
      `${featureName}: потратить одно использование Божественного канала?`,
      'Потратить',
      () =>
        updateActiveCharacter((c) => ({
          ...c,
          resources: c.resources.map((r) =>
            r.id === CHANNEL_RESOURCE_ID && r.current > 0 ? { ...r, current: r.current - 1 } : r,
          ),
        })),
    )
  }

  const useHarnessDivinePower = () => {
    const result = applyHarnessDivinePower(activeCharacter, selectedHarnessLevel)
    if (!result.ok) {
      tell('Праведное восстановление', result.reason)
      return
    }
    ask(
      'Праведное восстановление',
      `Праведное восстановление: потратить одно использование Божественного канала и вернуть ячейку ${selectedHarnessLevel} круга?`,
      'Восстановить',
      () =>
        updateActiveCharacter((c) => {
          const applied = applyHarnessDivinePower(c, selectedHarnessLevel)
          return applied.ok ? applied.character : c
        }),
    )
  }

  const domainFeatures = DEATH_DOMAIN_FEATURES.filter(
    (f) => f.level <= activeCharacter.level,
  )

  const showMechanic = newTable ? onMechanic : (title: string, text: string) => alert(`${title}: ${text}`)

  const slotsSection = (
    <section className="card">
        <h2 className="section-title">Ячейки заклинаний</h2>
        {derived.spellSlots.map((s) => (
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
  )

  const concentrationSection = activeCharacter.concentration && (
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
            onShow={showMechanic}
          />
          <button
            type="button"
            className="btn"
            onClick={() => updateActiveCharacter({ concentration: null })}
          >
            Прекратить концентрацию
          </button>
        </section>
      )

  const channelSection = channelResource && (
        <section className="card">
          <h2 className="section-title">Божественный канал</h2>
          <p>
            Доступно {channelResource.current} / {channelResource.max}
          </p>
          <p className="muted small">Восстанавливается после короткого или продолжительного отдыха.</p>
          {channelOptions.map((f) => {
            const isHarness = f.resourceId === HARNESS_RESOURCE_ID
            return (
              <article key={f.id} className="feature-block">
                <h4>{f.name}</h4>
                <p>
                  {f.description}
                  {f.id === 'cleric_turn_undead' && destroyCr
                    ? ` Если показатель опасности нежити не выше ${destroyCr}, провал спасброска уничтожает её мгновенно.`
                    : ''}
                </p>
                <ul className="muted small">
                  {f.usage && <li>Использование: {f.usage}</li>}
                  {f.limits && <li>Ограничения: {f.limits}</li>}
                  {isHarness && harnessResource && (
                    <li>
                      Использований умения: {harnessResource.current} / {harnessResource.max}. Максимальный
                      круг ячейки: {harnessMaxLevel}
                    </li>
                  )}
                </ul>
                {isHarness ? (
                  <div className="spell-picker">
                    <select
                      className="input"
                      value={selectedHarnessLevel || ''}
                      onChange={(e) => setHarnessSlotLevel(e.target.value)}
                      disabled={restorableLevels.length === 0}
                      aria-label="Круг возвращаемой ячейки"
                    >
                      {restorableLevels.length === 0 ? (
                        <option value="">Нет потраченных ячеек</option>
                      ) : (
                        restorableLevels.map((level) => (
                          <option key={level} value={level}>
                            Ячейка {level} круга
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      className="btn-small"
                      disabled={
                        restorableLevels.length === 0 ||
                        channelResource.current <= 0 ||
                        !harnessResource ||
                        harnessResource.current <= 0
                      }
                      onClick={useHarnessDivinePower}
                    >
                      Восстановить ячейку
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-small"
                    disabled={channelResource.current <= 0}
                    onClick={() => useChannelDivinity(f.name)}
                  >
                    Использовать
                  </button>
                )}
              </article>
            )
          })}
        </section>
      )

  const destroySection = destroyUndead && (
        <section className="card">
          <h2 className="section-title">Уничтожение нежити</h2>
          <article className="feature-block">
            <h4>
              {destroyUndead.name} <span className="muted">(ур. {destroyUndead.level})</span>
            </h4>
            <p>{destroyUndead.description}</p>
            <ul className="muted small">
              {destroyCr && (
                <li>Сейчас уничтожается нежить с показателем опасности {destroyCr} или ниже.</li>
              )}
              {destroyUndead.usage && <li>Использование: {destroyUndead.usage}</li>}
              {destroyUndead.limits && <li>Ограничения: {destroyUndead.limits}</li>}
              <li>Тип: {destroyUndead.actionType}</li>
            </ul>
          </article>
        </section>
      )

  const preparationSection = (
      <section className="card">
        <h2 className="section-title">Подготовка заклинаний</h2>
        <p>
          Подготовлено {activeCharacter.preparedSpellIds.length} / {derived.preparedSpellLimit}
        </p>
        <SpellPreparationPicker
          classId={activeCharacter.classId}
          level={activeCharacter.level}
          wisdom={derived.abilityScores.wis}
          preparedIds={activeCharacter.preparedSpellIds}
          cantripIds={activeCharacter.cantripIds}
          domainIds={derived.domainSpellIds}
          onPreparedChange={(preparedSpellIds) => updateActiveCharacter({ preparedSpellIds })}
          onCantripsChange={(cantripIds) => updateActiveCharacter({ cantripIds })}
          onBlocked={
            newTable
              ? (text) => openNotice({ title: 'Подготовка заклинаний', text })
              : undefined
          }
          reaper={
            activeCharacter.subclassId === 'death_domain'
              ? {
                  cantripId: activeCharacter.reaperCantripId,
                  onChange: (reaperCantripId) => updateActiveCharacter({ reaperCantripId }),
                }
              : undefined
          }
          onExplainLimit={() => setLimitBreakdown(derived.preparedSpellLimitBreakdown)}
        />
      </section>
  )

  const domainSpellSection = (
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
  )

  const domainFeatureSection = (
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
  )

  const spellLists = (
    <>
      <SpellList title="Заговоры" spells={cantrips} onCast={castSpell} tags={cantripTags} />
      <SpellList title="Подготовленные" spells={prepared} onCast={castSpell} />
      <SpellList title="Известные" spells={known} onCast={castSpell} />
    </>
  )

  return (
    <div className="stack gap-lg">
      {slotsSection}
      {concentrationSection}
      {newTable && (
        <>
          <SpellList
            title="Подготовленные"
            spells={prepared}
            onCast={castSpell}
            emptyText="Пока ничего не подготовлено. Доменные заклинания ниже уже готовы к наложению."
          />
          {domainSpellSection}
          <SpellList title="Заговоры" spells={cantrips} onCast={castSpell} tags={cantripTags} />
        </>
      )}
      {channelSection}
      {destroySection}
      {newTable ? (
        <>
          {domainFeatureSection}
          {preparationSection}
          <SpellList title="Известные" spells={known} onCast={castSpell} />
        </>
      ) : (
        <>
          {preparationSection}
          {domainSpellSection}
          {domainFeatureSection}
          {spellLists}
        </>
      )}
      <RulesExplanation breakdown={limitBreakdown} onClose={() => setLimitBreakdown(null)} />
    </div>
  )
}

function applyCast(
  character: Character,
  def: NonNullable<ReturnType<typeof getSpell>>,
  slotLevel: number | null,
): Character {
  if (slotLevel != null) {
    const slot = character.spellSlots.find((item) => item.level === slotLevel)
    if (!slot || slot.current <= 0) return character
  }
  const spellSlots =
    slotLevel == null
      ? character.spellSlots
      : character.spellSlots.map((slot) =>
          slot.level === slotLevel && slot.current > 0 ? { ...slot, current: slot.current - 1 } : slot,
        )
  return {
    ...character,
    spellSlots,
    concentration: def.concentration
      ? {
          spellId: def.id,
          name: def.name,
          duration: def.duration,
          summary: def.effect,
        }
      : character.concentration,
  }
}

function SpellList({
  title,
  spells,
  onCast,
  tags,
  emptyText = 'Список пуст. Выберите заклинания в блоке подготовки выше.',
}: {
  title: string
  spells: ReturnType<typeof getSpellsByIds>
  onCast: (id: string) => void
  tags?: Record<string, string>
  emptyText?: string
}) {
  return (
    <section className="card">
      <h3 className="section-title">{title}</h3>
      {spells.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        spells.map((s) => <SpellCard key={s.id} spell={s} onCast={() => onCast(s.id)} tag={tags?.[s.id]} />)
      )}
    </section>
  )
}

function SpellCard({
  spell,
  onCast,
  domain,
  tag,
}: {
  spell: NonNullable<ReturnType<typeof getSpell>>
  onCast: () => void
  domain?: boolean
  tag?: string
}) {
  return (
    <article className={`spell-card ${domain ? 'domain' : ''}`}>
      <header>
        <strong>{spell.name}</strong>
        <span className="chip">{spell.level === 0 ? 'заговор' : `${spell.level} ур.`}</span>
        {tag && <span className="chip">{tag}</span>}
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
