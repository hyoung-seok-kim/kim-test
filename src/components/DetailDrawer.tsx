import { Fragment, useEffect } from 'react'
import type { Blogger } from '../types'

export default function DetailDrawer({ blogger, onClose }: { blogger: Blogger | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  if (!blogger) return null

  const rows: [string, string][] = [
    ['카테고리', blogger.category || '-'],
    ['오늘 방문자', blogger.todayVisitors?.toLocaleString() ?? '비공개'],
    ['이웃', blogger.neighbors?.toLocaleString() ?? '-'],
    ['최근 포스팅', blogger.lastPostDate ?? '-'],
    ['협업 메일', blogger.collabMail ? '공개' : '비공개'],
    ['발송', blogger.sent ? `완료 (${blogger.sentDate ?? '날짜 없음'})` : '미발송'],
    ['회신', blogger.reply || '-'],
    ['검토 결과', blogger.review || '-'],
    ['메모', blogger.memo || '-'],
  ]
  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-black/30" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{blogger.name}</h2>
          <button className="text-slate-500" aria-label="닫기" onClick={onClose}>✕</button>
        </div>
        <a href={blogger.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-blue-600 hover:underline dark:text-blue-400">{blogger.url}</a>
        <dl className="mt-5 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
          {rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-slate-500">{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
        <h3 className="mt-6 text-sm font-medium">올리브영 관련 근거</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {blogger.evidence ?? '추천 목록에 없는 블로거입니다.'}
        </p>
      </aside>
    </div>
  )
}
