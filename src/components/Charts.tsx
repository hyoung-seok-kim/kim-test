import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Blogger } from '../types'
import { categoryCounts, funnel, scatterData, type Dot } from '../lib/chartData'

const tick = { fill: 'var(--viz-ink)', fontSize: 12 }
const axisLine = { stroke: 'var(--viz-axis)' }
const tipStyle = {
  background: 'var(--tip-bg, #fff)', border: '1px solid var(--viz-axis)', borderRadius: 8, fontSize: 12, color: 'var(--viz-ink)',
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-medium">{title}</h3>
      {note && <p className="text-xs text-slate-500">{note}</p>}
      <div className="mt-3 h-64">{children}</div>
    </div>
  )
}

function BarsH({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 36 }}>
        <CartesianGrid horizontal={false} stroke="var(--viz-grid)" />
        <XAxis type="number" allowDecimals={false} tick={tick} axisLine={axisLine} tickLine={false} />
        <YAxis type="category" dataKey="name" width={84} tick={tick} axisLine={axisLine} tickLine={false} />
        <Tooltip cursor={{ fill: 'var(--viz-grid)', opacity: 0.4 }} contentStyle={tipStyle} formatter={(v) => [`${v}명`, '블로거']} />
        <Bar dataKey="count" fill="var(--series-1)" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" style={{ fill: 'var(--viz-ink)', fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function DotTip({ active, payload }: { active?: boolean; payload?: { payload: Dot }[] }) {
  const d = active && payload?.[0]?.payload
  if (!d) return null
  return (
    <div style={{ ...tipStyle, padding: '6px 10px' }}>
      <div style={{ fontWeight: 600 }}>{d.name}</div>
      <div>이웃 {d.x.toLocaleString()} · 방문자 {d.y.toLocaleString()}</div>
    </div>
  )
}

export default function Charts({ data }: { data: Blogger[] }) {
  const sc = scatterData(data)
  const cats = categoryCounts(data).slice(0, 8)
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card title="카테고리 분포" note={cats.length < categoryCounts(data).length ? '상위 8개' : undefined}>
        <BarsH data={cats} />
      </Card>
      <Card title="컨택 퍼널" note="수집 → 추천 → 발송 → 회신">
        <BarsH data={funnel(data)} />
      </Card>
      <Card title="이웃 수 × 오늘 방문자" note="로그 눈금 · 점에 마우스를 올리면 블로거 표시">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 0, right: 12, top: 4 }}>
            <CartesianGrid stroke="var(--viz-grid)" />
            <XAxis type="number" dataKey="x" name="이웃" scale="log" domain={['auto', 'auto']} tick={tick} axisLine={axisLine} tickLine={false} tickFormatter={(v) => Number(v).toLocaleString()} />
            <YAxis type="number" dataKey="y" name="방문자" scale="log" domain={['auto', 'auto']} width={48} tick={tick} axisLine={axisLine} tickLine={false} tickFormatter={(v) => Number(v).toLocaleString()} />
            <Tooltip content={<DotTip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--viz-axis)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--viz-ink)' }} />
            <Scatter name="올영 추천" data={sc.recommended} fill="var(--series-1)" stroke="var(--tip-bg, #fff)" strokeWidth={2} isAnimationActive={false} />
            <Scatter name="그 외" data={sc.others} fill="var(--series-2)" stroke="var(--tip-bg, #fff)" strokeWidth={2} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </section>
  )
}
