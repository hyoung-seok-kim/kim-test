import { useState } from 'react'
import Dashboard from './components/Dashboard'
import RecommendPage from './components/RecommendPage'

const TABS = [
  ['recommend', '키워드 추천'],
  ['dashboard', '수집 현황 (시트)'],
] as const
type Tab = (typeof TABS)[number][0]

const initialTab = (): Tab => (location.hash === '#dashboard' ? 'dashboard' : 'recommend')

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const select = (t: Tab) => {
    setTab(t)
    history.replaceState(null, '', `#${t}`)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">블로거 대시보드</h1>
        <nav className="flex gap-1 border-b border-slate-200 dark:border-slate-800" role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => select(id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      {tab === 'recommend' ? <RecommendPage /> : <Dashboard />}
    </main>
  )
}
