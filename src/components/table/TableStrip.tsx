import { CONDITIONS_2014 } from '../../data/conditions'
import { useCharacterStore } from '../../state/CharacterStore'
import { useTableMode } from '../../state/TableMode'
import type { CalculationBreakdown } from '../../types/explain'
import { characterAfterDamage, characterAfterHeal, characterAfterTempHp } from './hpChanges'

interface Props {
  onExplain?: (breakdown: CalculationBreakdown) => void
}

export function TableStrip({ onExplain }: Props) {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()
  const { openAmount } = useTableMode()
  const maxHp = derived.maxHp

  const askAmount = (title: string, apply: (amount: number) => void) => {
    openAmount({ title, onApply: apply })
  }

  const conditionNames = activeCharacter.conditions.map(
    (id) => CONDITIONS_2014.find((item) => item.id === id)?.name ?? id,
  )
  const slots =
    derived.spellSlots.length === 0
      ? 'нет'
      : derived.spellSlots.map((slot) => `${slot.level}:${slot.current}`).join(' ')

  return (
    <section className="table-strip" aria-label="Полоса стола">
      <div className="strip-stats">
        <StripStat
          label="Хиты"
          value={
            activeCharacter.tempHp > 0
              ? `${activeCharacter.currentHp}/${maxHp} +${activeCharacter.tempHp}`
              : `${activeCharacter.currentHp}/${maxHp}`
          }
          onClick={onExplain ? () => onExplain(derived.maxHpBreakdown) : undefined}
        />
        <StripStat
          label="КД"
          value={String(derived.ac)}
          onClick={onExplain ? () => onExplain(derived.acBreakdown) : undefined}
        />
        <StripStat label="Ячейки" value={slots} />
        <StripStat label="Состояния" value={conditionNames.length === 0 ? 'нет' : conditionNames.join(', ')} />
      </div>
      <div className="strip-actions">
        <button
          type="button"
          className="btn"
          onClick={() =>
            askAmount('Получить урон', (amount) =>
              updateActiveCharacter((character) => characterAfterDamage(character, amount)),
            )
          }
        >
          Получить урон
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            askAmount('Лечение', (amount) =>
              updateActiveCharacter((character) => characterAfterHeal(character, amount, maxHp)),
            )
          }
        >
          Лечение
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            askAmount('Временные хиты', (amount) =>
              updateActiveCharacter((character) => characterAfterTempHp(character, amount)),
            )
          }
        >
          Временные хиты
        </button>
      </div>
    </section>
  )
}

function StripStat({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick?: () => void
}) {
  if (onClick) {
    return (
      <button type="button" className="strip-stat" onClick={onClick}>
        <span className="strip-label">{label}</span>
        <strong>{value}</strong>
      </button>
    )
  }
  return (
    <div className="strip-stat">
      <span className="strip-label">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
