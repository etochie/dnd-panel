import { useCharacterStore } from '../state/CharacterStore'
import type { JournalNpc } from '../types/character'
import { createId } from '../utils/id'

export function JournalPanel() {
  const { activeCharacter, updateActiveCharacter } = useCharacterStore()
  const j = activeCharacter.journal

  return (
    <div className="stack gap-lg">
      <section className="card">
        <h2 className="section-title">Знакомства</h2>
        <button
          type="button"
          className="btn"
          onClick={() =>
            updateActiveCharacter({
              journal: {
                ...j,
                npcs: [
                  ...j.npcs,
                  {
                    id: createId(),
                    name: '',
                    metAt: '',
                    attitude: '',
                    description: '',
                    facts: '',
                    notes: '',
                  },
                ],
              },
            })
          }
        >
          Добавить знакомство
        </button>
        {j.npcs.map((npc, idx) => (
          <JournalFields
            key={npc.id}
            fields={[
              ['name', 'Имя'],
              ['metAt', 'Где встретили'],
              ['attitude', 'Отношение'],
              ['description', 'Описание'],
              ['facts', 'Важные факты'],
              ['notes', 'Заметки'],
            ]}
            values={npc}
            onChange={(key, val) => {
              const npcs = [...j.npcs]
              npcs[idx] = { ...npc, [key]: val }
              updateActiveCharacter({ journal: { ...j, npcs } })
            }}
          />
        ))}
      </section>

      <section className="card">
        <h3 className="section-title">Интересные факты</h3>
        <textarea
          className="textarea"
          value={j.facts}
          onChange={(e) => updateActiveCharacter({ journal: { ...j, facts: e.target.value } })}
        />
      </section>

      <section className="card">
        <h3 className="section-title">Квесты</h3>
        <button
          type="button"
          className="btn"
          onClick={() =>
            updateActiveCharacter({
              journal: {
                ...j,
                quests: [
                  ...j.quests,
                  {
                    id: createId(),
                    title: '',
                    description: '',
                    status: 'active',
                    notes: '',
                  },
                ],
              },
            })
          }
        >
          Добавить квест
        </button>
        {j.quests.map((q, idx) => (
          <div key={q.id} className="journal-entry">
            <input
              className="input"
              placeholder="Название"
              value={q.title}
              onChange={(e) => {
                const quests = [...j.quests]
                quests[idx] = { ...q, title: e.target.value }
                updateActiveCharacter({ journal: { ...j, quests } })
              }}
            />
            <select
              value={q.status}
              onChange={(e) => {
                const quests = [...j.quests]
                quests[idx] = { ...q, status: e.target.value as typeof q.status }
                updateActiveCharacter({ journal: { ...j, quests } })
              }}
            >
              <option value="active">Активный</option>
              <option value="completed">Завершённый</option>
              <option value="failed">Проваленный</option>
              <option value="deferred">Отложенный</option>
            </select>
            <textarea
              className="textarea"
              placeholder="Описание и заметки"
              value={`${q.description}\n${q.notes}`}
              onChange={(e) => {
                const quests = [...j.quests]
                quests[idx] = { ...q, description: e.target.value, notes: '' }
                updateActiveCharacter({ journal: { ...j, quests } })
              }}
            />
          </div>
        ))}
      </section>

      <section className="card">
        <h3 className="section-title">Общие заметки</h3>
        <textarea
          className="textarea"
          value={j.generalNotes}
          onChange={(e) =>
            updateActiveCharacter({ journal: { ...j, generalNotes: e.target.value } })
          }
        />
      </section>
    </div>
  )
}

function JournalFields({
  fields,
  values,
  onChange,
}: {
  fields: [string, string][]
  values: JournalNpc
  onChange: (key: keyof JournalNpc, val: string) => void
}) {
  return (
    <div className="journal-entry">
      {fields.map(([key, label]) => (
        <label key={key} className="field">
          {label}
          <input
            className="input"
            value={values[key as keyof JournalNpc] ?? ''}
            onChange={(e) => onChange(key as keyof JournalNpc, e.target.value)}
          />
        </label>
      ))}
    </div>
  )
}
