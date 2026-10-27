import type { Summary } from '../lib/aggregate'

export default function SummaryCards({ s }: { s: Summary }) {
  const cards = [
    ['총 등록', s.total.toLocaleString()],
    ['올리브영 추천', s.recommended.toLocaleString()],
    ['협업 메일 공개', s.collabMail.toLocaleString()],
    ['발송 완료', s.sent.toLocaleString()],
    ['긍정 회신율', s.replyRate === null ? '-' : `${(s.replyRate * 100).toFixed(1)}%`],
  ]
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      ))}
    </section>
  )
}
