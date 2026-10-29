import { lazy, Suspense, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchBloggers, useBloggers } from '../api/client'
import { applyFilters, categories, defaultFilters, summarize, type Filters } from '../lib/aggregate'
import type { Blogger } from '../types'
import SummaryCards from './SummaryCards'
import FilterBar from './FilterBar'
import BloggerTable from './BloggerTable'
import DetailDrawer from './DetailDrawer'

// recharts 가 번들의 대부분이라 표가 먼저 뜨도록 분리한다.
const Charts = lazy(() => import('./Charts'))

export default function Dashboard() {
  const { data, isPending, isError, error, isFetching } = useBloggers()
  const qc = useQueryClient()
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [selected, setSelected] = useState<Blogger | null>(null)

  const all = data?.bloggers
  const filtered = useMemo(() => (all ? applyFilters(all, filters) : []), [all, filters])
  const summary = useMemo(() => summarize(all ?? []), [all])

  const refresh = async () => qc.setQueryData(['bloggers'], await fetchBloggers(true))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {data &&
            `구글 시트 · 키워드 '${data.settings.keyword}' · 최소 방문자 ${data.settings.minVisitors ?? '-'}명 · 갱신 ${new Date(data.fetchedAt).toLocaleString('ko-KR')}`}
        </p>
        <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700" disabled={isFetching} onClick={refresh}>
          {isFetching ? '불러오는 중…' : '새로고침'}
        </button>
      </div>

      {isPending && <p className="py-20 text-center text-slate-500">불러오는 중…</p>}
      {isError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          데이터를 불러오지 못했습니다: {error.message}
          <div className="mt-1 text-xs opacity-80">샘플 데이터로 화면을 보려면 주소 끝에 ?mock=1 을 붙이세요.</div>
        </div>
      )}
      {data && (
        <>
          <SummaryCards s={summary} />
          <FilterBar value={filters} onChange={setFilters} categories={categories(data.bloggers)} shown={filtered.length} total={data.bloggers.length} />
          <Suspense fallback={<div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800" />}>
            <Charts data={filtered} />
          </Suspense>
          <BloggerTable data={filtered} onSelect={setSelected} />
        </>
      )}
      <DetailDrawer blogger={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
