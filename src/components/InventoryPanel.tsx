import { getDragonbornBreath } from '../data/dragonborn'
import { ITEM_CATEGORY_LABELS, RESOURCE_LABELS } from '../data/labels'
import { applyLongRest, applyShortRest, previewLongRest, previewShortRest } from '../engine/rest'
import { useCharacterStore } from '../state/CharacterStore'
import type { InventoryItem } from '../types/character'

export function InventoryPanel() {
  const { activeCharacter, updateActiveCharacter } = useCharacterStore()

  const toggleEquip = (item: InventoryItem) => {
    if (!item.equipped && item.category === 'armor') {
      const hasArmor = activeCharacter.inventory.some(
        (i) => i.equipped && i.category === 'armor' && i.id !== item.id,
      )
      if (hasArmor) {
        alert('Уже экипирована другая броня. Снимите её сначала.')
        return
      }
    }
    updateActiveCharacter((c) => ({
      ...c,
      inventory: c.inventory.map((i) => {
        if (i.id === item.id) return { ...i, equipped: !i.equipped }
        if (!item.equipped && item.category === 'armor' && i.category === 'armor') {
          return { ...i, equipped: false }
        }
        return i
      }),
    }))
  }

  const useResource = (id: string) => {
    updateActiveCharacter((c) => ({
      ...c,
      resources: c.resources.map((r) =>
        r.id === id && r.current > 0 ? { ...r, current: r.current - 1 } : r,
      ),
    }))
  }

  const restoreResource = (id: string) => {
    updateActiveCharacter((c) => ({
      ...c,
      resources: c.resources.map((r) =>
        r.id === id ? { ...r, current: r.max } : r,
      ),
    }))
  }

  const shortPreview = previewShortRest(activeCharacter)
  const longPreview = previewLongRest(activeCharacter)

  const breath =
    activeCharacter.raceDetails?.breathType &&
    getDragonbornBreath(activeCharacter.level, activeCharacter.raceDetails.breathType)

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Ресурсы</h2>
        {activeCharacter.resources.length === 0 ? (
          <p className="muted">Нет ресурсов.</p>
        ) : (
          activeCharacter.resources.map((r) => (
            <div key={r.id} className="resource-row">
              <div>
                <strong>{RESOURCE_LABELS[r.id] ?? r.name}</strong>
                <p className="muted small">
                  {r.current} / {r.max} · восстановление:{' '}
                  {r.recharge === 'short_rest'
                    ? 'короткий отдых'
                    : r.recharge === 'long_rest'
                      ? 'продолжительный отдых'
                      : 'особое'}
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn-small"
                  disabled={r.current <= 0}
                  onClick={() => useResource(r.id)}
                >
                  Использовать
                </button>
                <button type="button" className="btn-small" onClick={() => restoreResource(r.id)}>
                  Восстановить
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {breath && (
        <section className="card">
          <h3 className="section-title">Драконье дыхание</h3>
          <ul>
            <li>Тип: {breath.damageType}</li>
            <li>Область: {breath.area}</li>
            <li>Спасбросок: {breath.save}</li>
            <li>Урон: {breath.damage}</li>
            <li>Использований: {breath.uses}</li>
            <li>Восстановление: {breath.recharge}</li>
          </ul>
        </section>
      )}

      <section className="card">
        <h3 className="section-title">Отдых</h3>
        <RestBlock
          title={shortPreview.label}
          lines={shortPreview.changes}
          onApply={() => updateActiveCharacter(applyShortRest(activeCharacter))}
        />
        <RestBlock
          title={longPreview.label}
          lines={longPreview.changes}
          onApply={() => {
            if (!confirm('Применить продолжительный отдых?')) return
            updateActiveCharacter(applyLongRest(activeCharacter))
          }}
        />
      </section>

      <section className="card">
        <h3 className="section-title">Экипировка</h3>
        {activeCharacter.inventory.filter((i) => i.equipped).length === 0 ? (
          <p className="muted">Ничего не экипировано.</p>
        ) : (
          activeCharacter.inventory
            .filter((i) => i.equipped)
            .map((i) => (
              <div key={i.id} className="item-row">
                {i.name}
                <button type="button" className="btn-small" onClick={() => toggleEquip(i)}>
                  Снять
                </button>
              </div>
            ))
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Инвентарь</h3>
        {activeCharacter.inventory.map((item) => (
          <div key={item.id} className="item-row">
            <div>
              <strong>{item.name}</strong>
              <span className="muted small">
                {' '}
                ×{item.quantity} · {ITEM_CATEGORY_LABELS[item.category]}
              </span>
            </div>
            <button type="button" className="btn-small" onClick={() => toggleEquip(item)}>
              {item.equipped ? 'Снять' : 'Экипировать'}
            </button>
          </div>
        ))}
      </section>

      <section className="card">
        <h3 className="section-title">Деньги</h3>
        <MoneyEditor />
      </section>
    </div>
  )
}

function RestBlock({
  title,
  lines,
  onApply,
}: {
  title: string
  lines: string[]
  onApply: () => void
}) {
  return (
    <div className="rest-block">
      <h4>{title}</h4>
      <ul>
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={onApply}>
        Применить
      </button>
    </div>
  )
}

function MoneyEditor() {
  const { activeCharacter, updateActiveCharacter } = useCharacterStore()
  const keys = [
    ['cp', 'Медные'],
    ['sp', 'Серебряные'],
    ['ep', 'Электрумовые'],
    ['gp', 'Золотые'],
    ['pp', 'Платиновые'],
  ] as const

  return (
    <div className="money-grid">
      {keys.map(([key, label]) => (
        <label key={key} className="money-field">
          {label}
          <input
            type="number"
            min={0}
            value={activeCharacter.money[key]}
            onChange={(e) => {
              const v = Math.max(0, parseInt(e.target.value, 10) || 0)
              updateActiveCharacter({
                money: { ...activeCharacter.money, [key]: v },
              })
            }}
          />
        </label>
      ))}
    </div>
  )
}
