import { useRef, useState } from 'react'
import { recommendApi } from '../api/recommendApi'
import { newSession, recommend, type Criteria, type Progress, type Session } from '../lib/recommend'
import { loadRecommended, saveRecommended, toCsv } from '../lib/recStore'
import type { Recommended } from '../types'

const WANT = 10
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'

export default function RecommendPage() {
  const [criteria, setCriteria] = useState<Criteria>({ keyword: '올리브영', minVisitors: 100, collabMailOnly: true })
  const [list, setList] = useState<Recommended[]>(loadRecommended)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const session = useRef<Session>(newSession())
  const abort = useRef<AbortController | null>(null)

  const sameKeyword = (r: Recommended) => r.keyword === criteria.keyword.trim()
  const shown = list.filter(sameKeyword)

  const run = async (restart: boolean) => {
    const keyword = criteria.keyword.trim()
    if (!keyword) return setMessage('키워드를 입력하세요')
    if (restart) session.current = newSession()
    setBusy(true)
    setMessage(null)
    setProgress(null)
    abort.current = new AbortController()
    try {
      const exclude = new Set(list.filter((r) => r.keyword === keyword).map((r) => r.id))
      const found = await recommend(
        recommendApi, { ...criteria, keyword }, session.current, exclude, WANT, setProgress, abort.current.signal,
      )
      const now = new Date().toISOString()
      const added: Recommended[] = found.map((b) => ({ ...b, url: `https://blog.naver.com/${b.id}`, keyword, foundAt: now }))
      const next = [...added, ...list]
      setList(next)
      saveRecommended(next)
      if (abort.current.signal.aborted) setMessage(`중단했습니다. ${added.length}명을 찾았습니다.`)
      else if (added.length < WANT)
        setMessage(`조건에 맞는 새 블로거가 더 없습니다 (${added.length}명). 방문자 수를 낮추거나 키워드를 바꿔보세요.`)
    } catch (e) {
      setMessage(`오류: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    if (!confirm('추천 기록을 모두 지울까요? 지우면 이미 추천한 블로거가 다시 나올 수 있습니다.')) return
    setList([])
    saveRecommended([])
    session.current = newSession()
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `추천블로거_${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">키워드</span>
          <input className={`${field} w-44`} value={criteria.keyword} disabled={busy}
            onChange={(e) => setCriteria({ ...criteria, keyword: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">오늘 방문자 수 (이상)</span>
          <input className={`${field} w-32`} type="number" min={0} step={50} value={criteria.minVisitors} disabled={busy}
            onChange={(e) => setCriteria({ ...criteria, minVisitors: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <label className="flex items-center gap-1.5 pb-2 text-sm">
          <input type="checkbox" checked={criteria.collabMailOnly} disabled={busy}
            onChange={(e) => setCriteria({ ...criteria, collabMailOnly: e.target.checked })} />
          협업 메일 공개된 블로거만
        </label>
        <div className="ml-auto flex gap-2">
          {busy ? (
            <button className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm dark:border-slate-700" onClick={() => abort.current?.abort()}>중단</button>
          ) : (
            <>
              {shown.length > 0 && (
                <button className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm dark:border-slate-700" onClick={() => run(false)}>{WANT}명 더 받기</button>
              )}
              <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700" onClick={() => run(true)}>
                {WANT}명 추천받기
              </button>
            </>
          )}
        </div>
      </section>

      {busy && (
        <p className="text-sm text-slate-500" role="status">
          후보를 검사하는 중… {progress ? `${progress.checked}명 확인, ${progress.found}/${WANT}명 찾음 (검색 ${progress.variant}회)` : '검색 중'}
        </p>
      )}
      {message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{message}</p>}

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            '{criteria.keyword.trim()}' 추천 {shown.length}명 · 전체 기록 {list.length}명
          </span>
          <span className="flex gap-3">
            <button className="underline disabled:opacity-40" disabled={list.length === 0} onClick={download}>CSV 내려받기</button>
            <button className="text-slate-500 underline disabled:opacity-40" disabled={list.length === 0} onClick={clear}>기록 지우기</button>
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/50">
              <tr>{['블로그', '오늘 방문자', '이웃', '협업 메일', '소개'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="px-3 py-2">
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-400">{r.name}</a>
                    <div className="text-xs text-slate-500">{r.id}</div>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.todayVisitors?.toLocaleString() ?? '-'}</td>
                  <td className="px-3 py-2 tabular-nums">{r.neighbors?.toLocaleString() ?? '-'}</td>
                  <td className="px-3 py-2">{r.emails.length ? r.emails.map((m) => <div key={m}>{m}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-500">{r.intro}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">조건을 입력하고 '{WANT}명 추천받기'를 눌러주세요</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">방문자 수는 네이버가 공개하는 오늘 방문자 수라 하루 중 시간대에 따라 달라집니다. 이메일은 블로그 소개글에 적힌 주소입니다. 추천 기록은 이 브라우저에만 저장됩니다.</p>
      </section>
    </div>
  )
}
