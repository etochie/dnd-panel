import { useState } from 'react'
import { CharacterSheet } from './components/CharacterSheet'
import { CombatPanel } from './components/CombatPanel'
import { SpellbookPanel } from './components/SpellbookPanel'
import { InventoryPanel } from './components/InventoryPanel'
import { JournalPanel } from './components/JournalPanel'
import { CharacterManagePanel } from './components/CharacterManagePanel'
import { RulesExplanation } from './components/RulesExplanation'
import { AppShell, type AppTab } from './components/layout/AppShell'
import { CharacterProvider, useCharacterStore } from './state/CharacterStore'
import type { CalculationBreakdown } from './types/explain'
import './App.css'

function AppInner() {
  const { activeCharacter } = useCharacterStore()
  const [tab, setTab] = useState<AppTab>('sheet')
  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null)
  const [mechanic, setMechanic] = useState<{ title: string; text: string } | null>(null)

  const titles: Record<AppTab, string> = {
    sheet: activeCharacter.name || 'Лист персонажа',
    combat: 'Бой',
    spells: 'Заклинания',
    inventory: 'Инвентарь и ресурсы',
    journal: 'Журнал',
    character: 'Персонаж',
  }

  const onMechanic = (title: string, text: string) => setMechanic({ title, text })

  return (
    <>
      <AppShell title={titles[tab]} activeTab={tab} onTabChange={setTab}>
        {tab === 'sheet' && <CharacterSheet onExplain={setBreakdown} />}
        {tab === 'combat' && (
          <CombatPanel onExplain={setBreakdown} onMechanic={onMechanic} />
        )}
        {tab === 'spells' && <SpellbookPanel />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'journal' && <JournalPanel />}
        {tab === 'character' && <CharacterManagePanel />}
      </AppShell>
      <RulesExplanation breakdown={breakdown} onClose={() => setBreakdown(null)} />
      <RulesExplanation
        breakdown={
          mechanic
            ? { title: mechanic.title, result: '', lines: [mechanic.text] }
            : null
        }
        onClose={() => setMechanic(null)}
      />
    </>
  )
}

export default function App() {
  return (
    <CharacterProvider>
      <AppInner />
    </CharacterProvider>
  )
}
