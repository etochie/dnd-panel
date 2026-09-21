import { ITEM_CATEGORY_LABELS, RESOURCE_LABELS } from '../data/labels'
import { applyLongRest, applyShortRest, previewLongRest, previewShortRest } from '../engine/rest'
import { useCharacterStore } from '../state/CharacterStore'
import type { InventoryItem, ItemCategory } from '../types/character'
import { createId } from '../utils/id'
import { NumberStepper } from './NumberStepper'

const CATEGORY_OPTIONS: ItemCategory[] = [
  'weapon',
  'armor',
  'shield',
  'consumable',
  'magic',
  'tool',
  'other',
]

function createBlankItem(): InventoryItem {
  return {
    id: createId(),
    name: 'Новый предмет',
    quantity: 1,
    weight: 0,
    cost: '',
    description: '',
    equipped: false,
    category: 'other',
  }
}

export function InventoryPanel() {
  const { activeCharacter, derived, updateActiveCharacter } = useCharacterStore()

  const updateInventory = (map: (items: InventoryItem[]) => InventoryItem[]) => {
    updateActiveCharacter((c) => ({ ...c, inventory: map(c.inventory) }))
  }

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
        if (!item.equipped && item.category === 'shield' && i.category === 'shield') {
          return { ...i, equipped: false }
        }
        return i
      }),
    }))
  }

  const updateItem = (id: string, patch: Partial<InventoryItem>) => {
    updateInventory((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const removeItem = (id: string) => {
    if (!confirm('Удалить предмет?')) return
    updateInventory((items) => items.filter((i) => i.id !== id))
  }

  const addItem = () => {
    updateInventory((items) => [...items, createBlankItem()])
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
  const breath = derived.breath
  const equipped = activeCharacter.inventory.filter((i) => i.equipped)

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Ресурсы</h2>
        {derived.resources.length === 0 ? (
          <p className="muted">Нет ресурсов.</p>
        ) : (
          derived.resources.map((r) => (
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
        {equipped.length === 0 ? (
          <p className="muted">Ничего не экипировано.</p>
        ) : (
          equipped.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              onToggleEquip={() => toggleEquip(item)}
              equippedView
            />
          ))
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Инвентарь</h3>
        {activeCharacter.inventory.length === 0 ? (
          <p className="muted">Список пуст.</p>
        ) : (
          activeCharacter.inventory.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              onToggleEquip={() => toggleEquip(item)}
            />
          ))
        )}
        <button type="button" className="btn" onClick={addItem}>
          Добавить предмет
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Деньги</h3>
        <MoneyEditor />
      </section>
    </div>
  )
}

function InventoryItemRow({
  item,
  onUpdate,
  onRemove,
  onToggleEquip,
  equippedView = false,
}: {
  item: InventoryItem
  onUpdate: (patch: Partial<InventoryItem>) => void
  onRemove: () => void
  onToggleEquip: () => void
  equippedView?: boolean
}) {
  return (
    <div className="item-row item-row-edit">
      <div className="item-row-fields">
        <input
          className="input item-name-input"
          value={item.name}
          aria-label="Название предмета"
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <label className="field item-qty-field">
          Кол-во
          <NumberStepper
            label={`Количество ${item.name}`}
            value={item.quantity}
            min={1}
            max={9999}
            onChange={(quantity) => onUpdate({ quantity })}
          />
        </label>
        {!equippedView && (
          <label className="field">
            Категория
            <select
              className="input"
              value={item.category}
              onChange={(e) => {
                const category = e.target.value as ItemCategory
                const patch: Partial<InventoryItem> = { category }
                if (category === 'shield' && item.shieldBonus == null) {
                  patch.shieldBonus = 2
                }
                if (category === 'armor' && item.armorBaseAc == null) {
                  patch.armorBaseAc = 11
                  patch.armorType = 'light'
                }
                onUpdate(patch)
              }}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {ITEM_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </label>
        )}
        {item.category === 'shield' && (
          <label className="field">
            Бонус щита
            <NumberStepper
              label="Бонус щита"
              value={item.shieldBonus ?? 2}
              min={0}
              max={5}
              onChange={(shieldBonus) => onUpdate({ shieldBonus })}
            />
          </label>
        )}
        {item.category === 'armor' && (
          <label className="field">
            База КД
            <NumberStepper
              label="База КД брони"
              value={item.armorBaseAc ?? 11}
              min={10}
              max={20}
              onChange={(armorBaseAc) => onUpdate({ armorBaseAc })}
            />
          </label>
        )}
      </div>
      <div className="row-actions item-row-actions">
        <button type="button" className="btn-small" onClick={onToggleEquip}>
          {item.equipped ? 'Снять' : 'Экипировать'}
        </button>
        <button type="button" className="btn-small btn-danger" onClick={onRemove}>
          Удалить
        </button>
      </div>
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
    ['gp', 'Золото (GP)'],
    ['sp', 'Серебро (SP)'],
    ['cp', 'Медь (CP)'],
  ] as const

  const setMoney = (key: 'gp' | 'sp' | 'cp', value: number) => {
    updateActiveCharacter({
      money: { ...activeCharacter.money, [key]: value },
    })
  }

  return (
    <div className="money-grid">
      {keys.map(([key, label]) => (
        <label key={key} className="money-field">
          {label}
          <NumberStepper
            label={label}
            value={activeCharacter.money[key]}
            min={0}
            max={999999}
            onChange={(value) => setMoney(key, value)}
          />
        </label>
      ))}
    </div>
  )
}
