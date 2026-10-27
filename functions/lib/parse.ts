import type { Blogger, Settings } from '../../src/types'

export type Row = string[]

const REQUIRED = ['블로그명', '블로그 링크'] as const

export function toNumber(v: string | undefined): number | null {
  if (!v) return null
  const n = Number(v.replace(/[,\s]/g, ''))
  return Number.isFinite(n) && /\d/.test(v) ? n : null
}

export function toBool(v: string | undefined): boolean {
  return ['O', 'TRUE', 'Y', '충족'].includes((v ?? '').trim().toUpperCase())
}

export function toDate(v: string | undefined): string | null {
  const m = (v ?? '').match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}

export function blogId(url: string): string {
  const m = url.match(/blog\.naver\.com\/([^/?#\s]+)/)
  return (m ? m[1] : url).toLowerCase()
}

/** 헤더명 → 열 인덱스. 필수 헤더가 없으면 시트 구조가 바뀐 것이므로 에러. */
function headerIndex(sheet: string, header: Row): Map<string, number> {
  const idx = new Map<string, number>()
  header.forEach((h, i) => idx.set(h.trim(), i))
  for (const r of REQUIRED) {
    if (!idx.has(r)) throw new Error(`'${sheet}' 시트에 필수 헤더 '${r}' 가 없습니다`)
  }
  return idx
}

function cell(row: Row, idx: Map<string, number>, name: string): string {
  const i = idx.get(name)
  return i === undefined ? '' : (row[i] ?? '').trim()
}

type Evidence = { mentions: number | null; evidence: string }

export function parseRecommended(rows: Row[]): Map<string, Evidence> {
  const out = new Map<string, Evidence>()
  if (rows.length === 0) return out
  const idx = headerIndex('추천 블로거', rows[0])
  for (const row of rows.slice(1)) {
    const url = cell(row, idx, '블로그 링크')
    if (!url) continue
    const evidence = cell(row, idx, '올리브영 관련 근거')
    const m = evidence.match(/언급\s*(\d+)\s*건/)
    out.set(blogId(url), { mentions: m ? Number(m[1]) : null, evidence })
  }
  return out
}

export function parseBloggers(rows: Row[], recommended: Map<string, Evidence>): Blogger[] {
  if (rows.length === 0) return []
  const idx = headerIndex('블로거 리스트', rows[0])
  const byId = new Map<string, Blogger>()

  const add = (b: Blogger) => {
    if (!byId.has(b.id)) byId.set(b.id, b)
  }

  for (const row of rows.slice(1)) {
    const url = cell(row, idx, '블로그 링크')
    if (!url) continue
    const id = blogId(url)
    const rec = recommended.get(id)
    add({
      id,
      name: cell(row, idx, '블로그명'),
      url,
      todayVisitors: toNumber(cell(row, idx, '오늘 방문자 수')),
      neighbors: toNumber(cell(row, idx, '이웃 수')),
      lastPostDate: toDate(cell(row, idx, '최근 포스팅일')),
      category: cell(row, idx, '주요 카테고리'),
      collabMail: toBool(cell(row, idx, '협업 메일 공개')),
      meetsCondition: toBool(cell(row, idx, '조건 충족')),
      review: cell(row, idx, '검토 결과'),
      sent: toBool(cell(row, idx, '발송 여부')),
      sentDate: toDate(cell(row, idx, '발송일')),
      reply: cell(row, idx, '회신'),
      memo: cell(row, idx, '메모'),
      oliveyoungMentions: rec?.mentions ?? null,
      evidence: rec?.evidence ?? null,
      recommended: !!rec,
    })
  }
  return [...byId.values()]
}

/** 추천 탭에는 있지만 원본 탭에 없는 블로거도 누락 없이 포함한다. */
export function mergeRecommendedOnly(
  bloggers: Blogger[],
  recRows: Row[],
): Blogger[] {
  if (recRows.length === 0) return bloggers
  const have = new Set(bloggers.map((b) => b.id))
  const idx = headerIndex('추천 블로거', recRows[0])
  const extra: Blogger[] = []
  for (const row of recRows.slice(1)) {
    const url = cell(row, idx, '블로그 링크')
    if (!url || have.has(blogId(url))) continue
    const evidence = cell(row, idx, '올리브영 관련 근거')
    const m = evidence.match(/언급\s*(\d+)\s*건/)
    have.add(blogId(url))
    extra.push({
      id: blogId(url),
      name: cell(row, idx, '블로그명'),
      url,
      todayVisitors: toNumber(cell(row, idx, '오늘 방문자 수')),
      neighbors: toNumber(cell(row, idx, '이웃 수')),
      lastPostDate: toDate(cell(row, idx, '최근 포스팅일')),
      category: cell(row, idx, '주요 카테고리'),
      collabMail: toBool(cell(row, idx, '협업 메일 공개')),
      meetsCondition: false,
      review: '',
      sent: false,
      sentDate: null,
      reply: '',
      memo: '',
      oliveyoungMentions: m ? Number(m[1]) : null,
      evidence,
      recommended: true,
    })
  }
  return [...bloggers, ...extra]
}

export function parseSettings(rows: Row[]): Settings {
  const get = (label: string) => rows.find((r) => (r[0] ?? '').trim() === label)?.[1]
  return {
    minVisitors: toNumber(get('최소 방문자 수')),
    keyword: (get('검색 키워드') ?? '').trim(),
    batchSize: toNumber(get('한 번에 수집할 인원(명)')),
  }
}
