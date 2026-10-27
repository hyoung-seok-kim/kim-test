import type { Filters } from '../lib/aggregate'
import { defaultFilters } from '../lib/aggregate'

const field =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'

type Props = { value: Filters; onChange: (f: Filters) => void; categories: string[]; shown: number; total: number }

export default function FilterBar({ value, onChange, categories, shown, total }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v })
  return (
    <section className="flex flex-wrap items-center gap-3">
      <input
        className={`${field} w-48`}
        placeholder="블로그명·ID 검색"
        value={value.search}
        onChange={(e) => set('search', e.target.value)}
      />
      <select className={field} value={value.category} onChange={(e) => set('category', e.target.value)}>
        <option value="">전체 카테고리</option>
        {categories.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select className={field} value={value.minVisitors} onChange={(e) => set('minVisitors', Number(e.target.value))}>
        <option value={0}>방문자 전체</option>
        {[100, 500, 1000, 2000, 5000].map((n) => <option key={n} value={n}>{n.toLocaleString()}명 이상</option>)}
      </select>
      <select className={field} value={value.sent} onChange={(e) => set('sent', e.target.value as Filters['sent'])}>
        <option value="all">발송 전체</option>
        <option value="unsent">미발송</option>
        <option value="sent">발송 완료</option>
      </select>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={value.collabMailOnly} onChange={(e) => set('collabMailOnly', e.target.checked)} />
        협업 메일 공개
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={value.recommendedOnly} onChange={(e) => set('recommendedOnly', e.target.checked)} />
        추천만
      </label>
      <button className="text-sm text-slate-500 underline" onClick={() => onChange(defaultFilters)}>초기화</button>
      <span className="ml-auto text-sm text-slate-500">{shown.toLocaleString()} / {total.toLocaleString()}명</span>
    </section>
  )
}
