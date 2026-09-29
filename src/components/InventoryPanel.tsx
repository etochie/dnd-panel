import { useState } from 'react'
import { EQUIPMENT_CATALOG, createCatalogItem } from '../data/equipmentCatalog'
import { ARMOR_TYPE_AC_HINT } from '../rules/combat/armorClass'
import { ITEM_CATEGORY_LABELS, RESOURCE_LABELS } from '../data/labels'
import { applyLongRest, applyShortRest, previewLongRest, previewShortRest } from '../engine/rest'
import {
  describeItemWear,
  equipItemOnCharacter,
  itemInSlot,
  listEquipmentSlots,
  slotsForDisplay,
  unequipItemOnCharacter,
} from '../rules/combat/equipment'
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

const WEAR_CHOICES = [
  { id: '', label: 'не носится' },
  { id: 'one_hand', label: 'одна рука' },
  { id: 'two_hands', label: 'две руки' },
  { id: 'versatile', label: 'универсальное' },
  { id: 'ring', label: 'кольцо' },
  ...listEquipmentSlots()
    .filter((slot) => !['right_hand', 'left_hand', 'ring_1', 'ring_2'].includes(slot.id))
    .map((slot) => ({ id: slot.id, label: slot.label })),
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
  const [catalogId, setCatalogId] = useState('chain_mail')
  const [equipMessage, setEquipMessage] = useState<string | null>(null)

  const updateInventory = (map: (items: InventoryItem[]) => InventoryItem[]) => {
    updateActiveCharacter((c) => ({ ...c, inventory: map(c.inventory) }))
  }

  const toggleEquip = (item: InventoryItem) => {
    if (item.equipped) {
      setEquipMessage(null)
      updateActiveCharacter((c) => unequipItemOnCharacter(c, item.id))
      return
    }
    const preview = equipItemOnCharacter(activeCharacter, item.id)
    setEquipMessage(preview.warnings[0] ?? null)
    updateActiveCharacter((c) => equipItemOnCharacter(c, item.id).character)
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

  const addCatalogItem = () => {
    const item = createCatalogItem(catalogId)
    if (!item) return
    updateInventory((items) => [...items, item])
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
        <div className="slot-grid">
          {slotsForDisplay(activeCharacter.inventory).map((slot) => {
            const worn = itemInSlot(activeCharacter.inventory, slot.id)
            return (
              <div key={slot.id} className="slot-cell">
                <span className="muted small">{slot.label}</span>
                <div>{worn ? worn.name : 'пусто'}</div>
              </div>
            )
          })}
        </div>
        <p>
          <strong>КД {derived.ac}</strong>
          {derived.armorTypeLabel ? ` · ${derived.armorTypeLabel}` : ' · без брони'}
        </p>
        <p className="muted small">{derived.acSummary}</p>
        {equipMessage && <p className="warn-box small">{equipMessage}</p>}
        {derived.acWarnings.map((warning) => (
          <p key={warning} className="warn-box small">
            {warning}
          </p>
        ))}
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
        <div className="catalog-add">
          <label className="field">
            Снаряжение из правил
            <select className="input" value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
              {EQUIPMENT_CATALOG.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" onClick={addCatalogItem}>
            Добавить из списка
          </button>
        </div>
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
  const wearValue = item.equipmentSlot ?? ''

  return (
    <div className="item-row item-row-edit">
      <div className="item-row-fields">
        <input
          className="input item-name-input"
          value={item.name}
          aria-label="Название предмета"
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <p className="muted small">
          {item.equipped ? 'Надето' : 'В инвентаре'}
          {' · '}
          {describeItemWear(item)}
        </p>
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
                if (category === 'shield') {
                  patch.equipmentSlot = 'shield'
                  if (item.shieldBonus == null) patch.shieldBonus = 2
                } else if (category === 'armor') {
                  patch.equipmentSlot = 'armor'
                  if (item.armorBaseAc == null) patch.armorBaseAc = 11
                  if (!item.armorType) patch.armorType = 'light'
                } else if (category === 'weapon') {
                  patch.equipmentSlot =
                    item.equipmentSlot === 'two_hands' || item.equipmentSlot === 'versatile'
                      ? item.equipmentSlot
                      : 'one_hand'
                } else if (category === 'consumable' || category === 'tool') {
                  patch.equipmentSlot = ''
                  patch.equipped = false
                  patch.equippedSlots = undefined
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
        {item.category === 'weapon' && !equippedView && (
          <label className="field">
            Хват
            <select
              className="input"
              value={
                wearValue === 'two_hands' || wearValue === 'versatile' ? wearValue : 'one_hand'
              }
              onChange={(e) => onUpdate({ equipmentSlot: e.target.value })}
            >
              <option value="one_hand">одна рука</option>
              <option value="versatile">универсальное</option>
              <option value="two_hands">две руки</option>
            </select>
          </label>
        )}
        {(item.category === 'magic' || item.category === 'other') && !equippedView && (
          <label className="field">
            Слот
            <select
              className="input"
              value={wearValue}
              onChange={(e) =>
                onUpdate({
                  equipmentSlot: e.target.value,
                  equipped: e.target.value === '' ? false : item.equipped,
                  equippedSlots: e.target.value === '' ? undefined : item.equippedSlots,
                })
              }
            >
              {WEAR_CHOICES.map((choice) => (
                <option key={choice.id || 'none'} value={choice.id}>
                  {choice.label}
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
          <>
            <label className="field">
              Тип брони
              <select
                className="input"
                value={item.armorType ?? 'light'}
                onChange={(e) => {
                  const armorType = e.target.value as 'light' | 'medium' | 'heavy'
                  if (armorType === 'heavy') onUpdate({ armorType, armorMaxDex: null })
                  else if (armorType === 'medium') onUpdate({ armorType, armorMaxDex: 2 })
                  else onUpdate({ armorType, armorMaxDex: undefined })
                }}
              >
                <option value="light">легкая</option>
                <option value="medium">средняя</option>
                <option value="heavy">тяжелая</option>
              </select>
            </label>
            <p className="muted small">{ARMOR_TYPE_AC_HINT[item.armorType ?? 'light']}</p>
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
          </>
        )}
        {(item.category === 'armor' || item.category === 'shield' || item.category === 'magic') && (
          <label className="field">
            Магический бонус КД
            <NumberStepper
              label="Магический бонус КД"
              value={item.acBonus ?? 0}
              min={0}
              max={5}
              onChange={(acBonus) => onUpdate({ acBonus })}
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
