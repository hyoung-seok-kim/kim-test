import type { Recommended } from '../types'

const KEY = 'blog-agent:recommended:v1'

export function loadRecommended(): Recommended[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Recommended[]) : []
  } catch {
    return []
  }
}

export function saveRecommended(list: Recommended[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // 저장소를 못 쓰는 환경(시크릿 창 등)에서는 현재 화면에서만 유지된다
  }
}

const cell = (v: string | number | null) => {
  const s = v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 엑셀에서 한글이 깨지지 않도록 BOM 을 붙인 CSV 문자열 */
export function toCsv(list: Recommended[]): string {
  const head = ['블로그명', '블로그 링크', '오늘 방문자 수', '이웃 수', '협업 메일', '키워드', '추천일']
  const rows = list.map((r) => [
    r.name, r.url, r.todayVisitors, r.neighbors, r.emails.join(' / '), r.keyword, r.foundAt.slice(0, 10),
  ])
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}
