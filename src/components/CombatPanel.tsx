import { MECHANIC_HINTS } from '../data/combatActions'
import { ACTION_TYPE_LABELS } from '../data/labels'
import { useCharacterStore } from '../state/CharacterStore'
import { MechanicHint } from './RulesExplanation'
import type { CalculationBreakdown } from '../types/explain'

interface Props {
  onExplain: (b: CalculationBreakdown) => void
  onMechanic: (title: string, text: string) => void
}

export function CombatPanel({ onExplain, onMechanic }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const speed = derived.speed

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

  const nowSuggestions = {
    action: derived.actions.map((item) => item.name),
    bonus: derived.bonusActions.map((item) => item.name),
    reaction: derived.reactions.map((item) => item.name),
    movement: [`Осталось ${activeCharacter.combat.movementRemaining} м`],
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
            <strong>{activeCharacter.combat.movementRemaining} м</strong>
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
          {[...derived.actions, ...derived.bonusActions, ...derived.reactions].map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="action-item"
                onClick={() =>
                  onExplain({
                    title: a.name,
                    result: ACTION_TYPE_LABELS[a.actionType] ?? a.actionType,
                    lines: [a.summary, `Расход: ${a.spends}`, `После: ${a.after}`],
                  })
                }
              >
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
