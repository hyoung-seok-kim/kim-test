import { useRef, useState } from 'react'
import { recommendApi } from '../api/recommendApi'
import { MAX_KEYWORDS, parseKeywords } from '../lib/keywords'
import { newSession, recommend, type Progress, type Session } from '../lib/recommend'
import { loadRecommended, saveRecommended, toCsv } from '../lib/recStore'
import type { Recommended } from '../types'

const WANT = 10
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'
const btn = 'rounded-lg border border-slate-300 px-4 py-1.5 text-sm dark:border-slate-700'

export default function RecommendPage() {
  const [keywordInput, setKeywordInput] = useState('올리브영')
  const [minVisitors, setMinVisitors] = useState(100)
  const [collabMailOnly, setCollabMailOnly] = useState(true)
  const [list, setList] = useState<Recommended[]>(loadRecommended)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const sessions = useRef<Record<string, Session>>({})
  const abort = useRef<AbortController | null>(null)

  const keywords = parseKeywords(keywordInput)
  const recordedKeywords = [...new Set(list.map((r) => r.keyword))]
  const shown = filter ? list.filter((r) => r.keyword === filter) : list
  const canContinue = keywords.some((k) => list.some((r) => r.keyword === k))

  const run = async (restart: boolean) => {
    if (keywords.length === 0) return setMessages(['키워드를 입력하세요'])
    setBusy(true)
    setMessages([])
    abort.current = new AbortController()
    const { signal } = abort.current
    // 키워드가 달라도 같은 블로거에게 두 번 연락하지 않도록, 이미 추천한 블로거는 전체 기록에서 제외한다.
    const exclude = new Set(list.map((r) => r.id))
    let next = list
    const notes: string[] = []
    try {
      for (const keyword of keywords) {
        if (signal.aborted) break
        if (restart || !sessions.current[keyword]) sessions.current[keyword] = newSession()
        setCurrent(keyword)
        setProgress(null)
        const found = await recommend(
          recommendApi, { keyword, minVisitors, collabMailOnly }, sessions.current[keyword], exclude, WANT, setProgress, signal,
        )
        const now = new Date().toISOString()
        const added: Recommended[] = found.map((b) => ({ ...b, url: `https://blog.naver.com/${b.id}`, keyword, foundAt: now }))
        added.forEach((a) => exclude.add(a.id))
        next = [...added, ...next]
        setList(next)
        saveRecommended(next)
        if (added.length < WANT && !signal.aborted) notes.push(`'${keyword}': 조건에 맞는 새 블로거가 ${added.length}명뿐입니다.`)
      }
      if (signal.aborted) notes.push('중단했습니다.')
      if (notes.length) notes.push('방문자 수를 낮추거나 키워드를 바꿔보세요.')
      setMessages(notes)
    } catch (e) {
      setMessages([`오류: ${e instanceof Error ? e.message : String(e)}`])
    } finally {
      setBusy(false)
      setCurrent(null)
    }
  }

  const clear = () => {
    if (!confirm('추천 기록을 모두 지울까요? 지우면 이미 추천한 블로거가 다시 나올 수 있습니다.')) return
    setList([])
    setFilter('')
    saveRecommended([])
    sessions.current = {}
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(shown)], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `추천블로거_${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="min-w-64 flex-1 text-sm">
          <span className="mb-1 block text-xs text-slate-500">키워드 (쉼표로 구분, 최대 {MAX_KEYWORDS}개)</span>
          <input className={`${field} w-full`} value={keywordInput} disabled={busy} placeholder="예: 올리브영, 다이소, 쿠팡"
            onChange={(e) => setKeywordInput(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">오늘 방문자 수 (이상)</span>
          <input className={`${field} w-32`} type="number" min={0} step={50} value={minVisitors} disabled={busy}
            onChange={(e) => setMinVisitors(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className="flex items-center gap-1.5 pb-2 text-sm">
          <input type="checkbox" checked={collabMailOnly} disabled={busy} onChange={(e) => setCollabMailOnly(e.target.checked)} />
          협업 메일 공개된 블로거만
        </label>
        <div className="ml-auto flex gap-2">
          {busy ? (
            <button className={btn} onClick={() => abort.current?.abort()}>중단</button>
          ) : (
            <>
              {canContinue && <button className={btn} onClick={() => run(false)}>키워드별 {WANT}명 더 받기</button>}
              <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700" onClick={() => run(true)}>
                {keywords.length > 1 ? `키워드별 ${WANT}명 추천받기` : `${WANT}명 추천받기`}
              </button>
            </>
          )}
        </div>
        {keywords.length > 1 && (
          <p className="w-full text-xs text-slate-500">
            {keywords.map((k) => `'${k}'`).join(', ')} 각각 {WANT}명씩, 최대 {keywords.length * WANT}명을 찾습니다. 같은 블로거는 한 번만 나옵니다.
          </p>
        )}
      </section>

      {busy && (
        <p className="text-sm text-slate-500" role="status">
          '{current}' 후보를 검사하는 중… {progress ? `${progress.checked}명 확인, ${progress.found}/${WANT}명 찾음 (검색 ${progress.variant}회)` : '검색 중'}
        </p>
      )}
      {messages.length > 0 && (
        <div className="space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {messages.map((m) => <p key={m}>{m}</p>)}
        </div>
      )}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {['', ...recordedKeywords].map((k) => (
              <button key={k || 'all'} onClick={() => setFilter(k)} aria-pressed={filter === k}
                className={`rounded-full border px-3 py-0.5 text-xs ${filter === k ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                {k || '전체'} {k ? list.filter((r) => r.keyword === k).length : list.length}
              </button>
            ))}
          </div>
          <span className="flex gap-3">
            <button className="underline disabled:opacity-40" disabled={shown.length === 0} onClick={download}>CSV 내려받기{filter ? ` (${filter})` : ''}</button>
            <button className="text-slate-500 underline disabled:opacity-40" disabled={list.length === 0} onClick={clear}>기록 지우기</button>
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/50">
              <tr>{['블로그', '키워드', '오늘 방문자', '이웃', '협업 메일', '소개'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <td className="px-3 py-2">
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline dark:text-blue-400">{r.name}</a>
                    <div className="text-xs text-slate-500">{r.id}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{r.keyword}</td>
                  <td className="px-3 py-2 tabular-nums">{r.todayVisitors?.toLocaleString() ?? '-'}</td>
                  <td className="px-3 py-2 tabular-nums">{r.neighbors?.toLocaleString() ?? '-'}</td>
                  <td className="px-3 py-2">{r.emails.length ? r.emails.map((m) => <div key={m}>{m}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-500">{r.intro}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-slate-500">키워드와 조건을 입력하고 '{WANT}명 추천받기'를 눌러주세요</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">방문자 수는 네이버가 공개하는 오늘 방문자 수라 하루 중 시간대에 따라 달라집니다. 이메일은 블로그 소개글에 적힌 주소입니다. 추천 기록은 이 브라우저에만 저장됩니다.</p>
      </section>
    </div>
  )
}
