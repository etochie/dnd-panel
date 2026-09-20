import { useEffect, useState, type ReactNode } from 'react'
import './AppShell.css'

export type AppTab =
  | 'sheet'
  | 'combat'
  | 'spells'
  | 'inventory'
  | 'journal'
  | 'character'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'sheet', label: 'Лист' },
  { id: 'combat', label: 'Бой' },
  { id: 'spells', label: 'Заклинания' },
  { id: 'inventory', label: 'Инвентарь' },
  { id: 'journal', label: 'Журнал' },
  { id: 'character', label: 'Персонаж' },
]

interface Props {
  title: string
  children: ReactNode
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function AppShell({ title, children, activeTab, onTabChange }: Props) {
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const closeNav = () => setNavOpen(false)
  const goTo = (tab: AppTab) => {
    onTabChange(tab)
    closeNav()
  }

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}>
      {navOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Закрыть меню"
          onClick={closeNav}
        />
      )}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`} id="app-sidebar">
        <div className="sidebar-header">
          <div className="brand">Помощник D&D</div>
          <button type="button" className="sidebar-close" onClick={closeNav}>
            Закрыть
          </button>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => goTo(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="main-column">
        <header className="top-bar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
          >
            {navOpen ? '×' : '☰'}
          </button>
          <h1>{title}</h1>
        </header>
        <main className="page-content">{children}</main>
        <nav className="bottom-nav" aria-label="Основная навигация">
          {TABS.filter((t) =>
            ['sheet', 'combat', 'spells', 'inventory'].includes(t.id),
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => goTo(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
