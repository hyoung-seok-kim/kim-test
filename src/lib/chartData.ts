import type { Blogger } from '../types'

export function categoryCounts(list: Blogger[]): { name: string; count: number }[] {
  const m = new Map<string, number>()
  for (const b of list) m.set(b.category || '미분류', (m.get(b.category || '미분류') ?? 0) + 1)
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
}

export type Dot = { name: string; x: number; y: number }

/** 방문자·이웃이 모두 공개된 블로거만. 로그 축이라 0 이하는 제외한다. */
export function scatterData(list: Blogger[]): { recommended: Dot[]; others: Dot[] } {
  const out = { recommended: [] as Dot[], others: [] as Dot[] }
  for (const b of list) {
    if (!b.todayVisitors || !b.neighbors || b.todayVisitors <= 0 || b.neighbors <= 0) continue
    out[b.recommended ? 'recommended' : 'others'].push({ name: b.name, x: b.neighbors, y: b.todayVisitors })
  }
  return out
}

export function funnel(list: Blogger[]): { name: string; count: number }[] {
  return [
    { name: '수집', count: list.length },
    { name: '올영 추천', count: list.filter((b) => b.recommended).length },
    { name: '협업 메일 공개', count: list.filter((b) => b.collabMail).length },
    { name: '발송', count: list.filter((b) => b.sent).length },
    { name: '긍정 회신', count: list.filter((b) => b.reply.includes('긍정')).length },
  ]
}
