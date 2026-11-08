import { MECHANIC_HINTS, type CombatActionDef } from '../data/combatActions'
import { formatFeetWithMeters } from '../data/distances'
import { ACTION_TYPE_LABELS } from '../data/labels'
import { useCharacterStore } from '../state/CharacterStore'
import { useTableMode } from '../state/TableMode'
import { MechanicHint } from './RulesExplanation'
import type { CalculationBreakdown } from '../types/explain'

interface Props {
  onExplain: (b: CalculationBreakdown) => void
  onMechanic: (title: string, text: string) => void
}

const STEP_METERS = 1.5

export function CombatPanel({ onExplain, onMechanic }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const { mode } = useTableMode()
  const speed = derived.speed
  const actions = [...derived.actions, ...derived.bonusActions, ...derived.reactions]

  const startTurn = () => {
    updateActiveCharacter((c) => ({
      ...c,
      combat: {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
        movementRemaining: speed,
      },
    }))
  }

  const endTurn = () => {
    updateActiveCharacter((c) => ({
      ...c,
      combat: { ...c.combat, reactionUsed: false },
    }))
  }

  const markAction = (field: 'actionUsed' | 'bonusActionUsed' | 'reactionUsed') => {
    updateActiveCharacter((c) => {
      if (c.combat[field]) return c
      return { ...c, combat: { ...c.combat, [field]: true } }
    })
  }

  const stepMovement = (delta: number) => {
    updateActiveCharacter((c) => ({
      ...c,
      combat: {
        ...c.combat,
        movementRemaining: Math.max(0, Math.round((c.combat.movementRemaining + delta) * 10) / 10),
      },
    }))
  }

  const explainAction = (action: CombatActionDef) => {
    onExplain({
      title: action.name,
      result: ACTION_TYPE_LABELS[action.actionType] ?? action.actionType,
      lines: [action.summary, `Расход: ${action.spends}`, `После: ${action.after}`],
    })
  }

  const useListedAction = (action: CombatActionDef) => {
    const field = spendField(action.actionType)
    if (field && action.id !== 'no_bonus') markAction(field)
    explainAction(action)
  }

  const useAttack = (breakdown: CalculationBreakdown) => {
    markAction('actionUsed')
    onExplain(breakdown)
  }

  const nowSuggestions = {
    action: derived.actions.map((item) => item.name),
    bonus: derived.bonusActions.map((item) => item.name),
    reaction: derived.reactions.map((item) => item.name),
    movement: [`Осталось ${formatFeetWithMeters(activeCharacter.combat.movementRemaining)}`],
  }

  if (mode === 'new') {
    const movement = activeCharacter.combat.movementRemaining
    return (
      <div className="stack gap-lg">
        <section className="card">
          <h2 className="section-title">Бой</h2>
          <div className="move-step">
            <span>Перемещение</span>
            <strong>{formatFeetWithMeters(movement)}</strong>
            <div className="row-actions">
              <button
                type="button"
                className="btn-small"
                disabled={movement <= 0}
                onClick={() => stepMovement(-STEP_METERS)}
              >
                −5 фт
              </button>
              <button type="button" className="btn-small" onClick={() => stepMovement(STEP_METERS)}>
                +5 фт
              </button>
            </div>
          </div>
          <div className="row-actions">
            <button type="button" className="btn btn-primary" onClick={startTurn}>
              Начать ход
            </button>
            <button type="button" className="btn" onClick={endTurn}>
              Закончить ход
            </button>
          </div>
          <p className="muted small">
            <MechanicHint term="Действие" text={MECHANIC_HINTS.action} onShow={onMechanic} />
            {' · '}
            <MechanicHint term="Бонусное действие" text={MECHANIC_HINTS.bonus_action} onShow={onMechanic} />
            {' · '}
            <MechanicHint term="Реакция" text={MECHANIC_HINTS.reaction} onShow={onMechanic} />
          </p>
        </section>

        <section className="card">
          <h3 className="section-title">Действия</h3>
          <ul className="action-list">
            {actions.map((action) => {
              const field = spendField(action.actionType)
              const informational = action.id === 'no_bonus'
              const spent = Boolean(field && !informational && activeCharacter.combat[field])
              return (
                <li key={action.id}>
                  <button
                    type="button"
                    className={`action-spend ${spent ? 'spent' : ''}`}
                    onClick={() => useListedAction(action)}
                  >
                    <strong>{action.name}</strong>
                    <span className="summary">{action.summary}</span>
                    <span className="spend-flag">
                      {informational
                        ? 'Справка'
                        : `${ACTION_TYPE_LABELS[action.actionType] ?? action.actionType} · ${spent ? 'Потрачено' : 'Доступно'}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card">
          <h3 className="section-title">Атаки</h3>
          {derived.attacks.length === 0 ? (
            <p className="muted">Нет экипированного оружия.</p>
          ) : (
            derived.attacks.map((atk) => {
              const spent = activeCharacter.combat.actionUsed
              const bonus = atk.attackBonus >= 0 ? `+${atk.attackBonus}` : String(atk.attackBonus)
              return (
                <div key={atk.id} className="attack-row">
                  <div>
                    <strong>{atk.name}</strong>
                    <p className="muted small">{atk.damage}</p>
                  </div>
                  <button
                    type="button"
                    className={`btn attack-cast ${spent ? 'spent' : ''}`}
                    onClick={() => useAttack(atk.breakdown)}
                  >
                    <span className="attack-bonus-value">{bonus}</span>
                    <span className="muted small">{spent ? 'Потрачено' : 'Действие'}</span>
                  </button>
                </div>
              )
            })
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Бой</h2>
        <div className="turn-track">
          <TurnPill
            label="Действие"
            ok={!activeCharacter.combat.actionUsed}
            onUse={() => markAction('actionUsed')}
          />
          <TurnPill
            label="Бонусное действие"
            ok={!activeCharacter.combat.bonusActionUsed}
            onUse={() => markAction('bonusActionUsed')}
          />
          <TurnPill
            label="Реакция"
            ok={!activeCharacter.combat.reactionUsed}
            onUse={() => markAction('reactionUsed')}
          />
          <div className="turn-pill">
            <span>Перемещение</span>
            <strong>{formatFeetWithMeters(activeCharacter.combat.movementRemaining)}</strong>
          </div>
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn-primary" onClick={startTurn}>
            Начать ход
          </button>
          <button type="button" className="btn" onClick={endTurn}>
            Закончить ход
          </button>
        </div>
        <p className="muted small">
          <MechanicHint term="Действие" text={MECHANIC_HINTS.action} onShow={onMechanic} />
          {' · '}
          <MechanicHint
            term="Бонусное действие"
            text={MECHANIC_HINTS.bonus_action}
            onShow={onMechanic}
          />
          {' · '}
          <MechanicHint term="Реакция" text={MECHANIC_HINTS.reaction} onShow={onMechanic} />
        </p>
      </section>

      <section className="card highlight">
        <h3 className="section-title">Что я могу сделать сейчас?</h3>
        <NowBlock title="Действие" items={nowSuggestions.action} />
        <NowBlock title="Бонусное действие" items={nowSuggestions.bonus} />
        <NowBlock title="Реакция" items={nowSuggestions.reaction} />
        <NowBlock title="Перемещение" items={nowSuggestions.movement} />
      </section>

      <section className="card">
        <h3 className="section-title">Действия</h3>
        <ul className="action-list">
          {actions.map((a) => (
            <li key={a.id}>
              <button type="button" className="action-item" onClick={() => explainAction(a)}>
                <strong>{a.name}</strong>
                <span>{a.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="section-title">Атаки</h3>
        {derived.attacks.length === 0 ? (
          <p className="muted">Нет экипированного оружия.</p>
        ) : (
          derived.attacks.map((atk) => (
            <div key={atk.id} className="attack-row">
              <div>
                <strong>{atk.name}</strong>
                <p className="muted small">{atk.damage}</p>
              </div>
              <button type="button" className="btn" onClick={() => onExplain(atk.breakdown)}>
                {atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus}
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function spendField(
  actionType: CombatActionDef['actionType'],
): 'actionUsed' | 'bonusActionUsed' | 'reactionUsed' | null {
  if (actionType === 'action') return 'actionUsed'
  if (actionType === 'bonus') return 'bonusActionUsed'
  if (actionType === 'reaction') return 'reactionUsed'
  return null
}

function TurnPill({
  label,
  ok,
  onUse,
}: {
  label: string
  ok: boolean
  onUse: () => void
}) {
  return (
    <div className={`turn-pill ${ok ? '' : 'spent'}`}>
      <span>{label}</span>
      <strong>{ok ? 'Доступно' : 'Использовано'}</strong>
      {ok && (
        <button type="button" className="btn-small" onClick={onUse}>
          Потратить
        </button>
      )}
    </div>
  )
}

function NowBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="now-block">
      <h4>{title}</h4>
      <ul>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}
