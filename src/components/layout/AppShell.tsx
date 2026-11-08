import { useEffect, useState, type ReactNode } from 'react'
import { useTableMode } from '../../state/TableMode'
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

const PRIMARY_TABS = TABS.filter((tab) =>
  ['sheet', 'combat', 'spells', 'inventory'].includes(tab.id),
)

interface Props {
  title: string
  children: ReactNode
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function AppShell({ title, children, activeTab, onTabChange }: Props) {
  const { mode, setMode } = useTableMode()
  const [navOpen, setNavOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const newTable = mode === 'new'

  useEffect(() => {
    if (!navOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const closeNav = () => setNavOpen(false)
  const goTo = (tab: AppTab) => {
    onTabChange(tab)
    closeNav()
    setMoreOpen(false)
  }

  const moreActive = activeTab === 'journal' || activeTab === 'character'

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''} ${newTable ? 'table-new' : ''}`}>
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
            onClick={() => setNavOpen((value) => !value)}
            aria-label={navOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
          >
            {navOpen ? '×' : '☰'}
          </button>
          <h1>{title}</h1>
          <div className="mode-switch" role="group" aria-label="Вид стола">
            <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>
              Новый стол
            </button>
            <button
              type="button"
              aria-pressed={mode === 'classic'}
              onClick={() => setMode('classic')}
            >
              Как было
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
        {newTable && moreOpen && (
          <button
            type="button"
            className="more-backdrop"
            aria-label="Закрыть меню Ещё"
            onClick={() => setMoreOpen(false)}
          />
        )}
        <nav className="bottom-nav" aria-label="Основная навигация">
          {PRIMARY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => goTo(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          {newTable && (
            <div className="more-slot">
              <button
                type="button"
                className={moreActive ? 'active' : ''}
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((value) => !value)}
              >
                Ещё
              </button>
              {moreOpen && (
                <div className="more-menu">
                  <button
                    type="button"
                    className={activeTab === 'journal' ? 'active' : ''}
                    onClick={() => goTo('journal')}
                  >
                    Журнал
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'character' ? 'active' : ''}
                    onClick={() => goTo('character')}
                  >
                    Персонаж
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}
