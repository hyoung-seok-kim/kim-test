import { useMemo, useState } from 'react'
import {
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState,
} from '@tanstack/react-table'
import type { Blogger } from '../types'

const col = createColumnHelper<Blogger>()
const num = (v: number | null) => (v === null ? '비공개' : v.toLocaleString())
const badge = (on: boolean, text: string) =>
  on ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{text}</span> : <span className="text-slate-400">-</span>

type Props = { data: Blogger[]; onSelect: (b: Blogger) => void }

export default function BloggerTable({ data, onSelect }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'todayVisitors', desc: true }])
  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: '블로그',
        cell: (c) => (
          <a href={c.row.original.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-400" onClick={(e) => e.stopPropagation()}>
            {c.getValue()}
          </a>
        ),
      }),
      col.accessor('category', { header: '카테고리' }),
      col.accessor('todayVisitors', { header: '오늘 방문자', cell: (c) => num(c.getValue()), sortUndefined: 'last' }),
      col.accessor('neighbors', { header: '이웃', cell: (c) => num(c.getValue()), sortUndefined: 'last' }),
      col.accessor('lastPostDate', { header: '최근 포스팅', cell: (c) => c.getValue() ?? '-' }),
      col.accessor('oliveyoungMentions', { header: '올영 언급', cell: (c) => (c.getValue() === null ? '-' : `${c.getValue()}건`) }),
      col.accessor('collabMail', { header: '협업 메일', cell: (c) => badge(c.getValue(), '공개') }),
      col.accessor('sent', { header: '발송', cell: (c) => badge(c.getValue(), '완료') }),
    ],
    [],
  )
  const table = useReactTable({
    data, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium" onClick={h.column.getToggleSortingHandler()}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40" onClick={() => onSelect(r.original)}>
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="whitespace-nowrap px-3 py-2 tabular-nums">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">조건에 맞는 블로거가 없습니다</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
