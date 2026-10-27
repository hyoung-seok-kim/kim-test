import type { Blogger } from '../types'

export type Filters = {
  search: string
  category: string
  minVisitors: number
  collabMailOnly: boolean
  recommendedOnly: boolean
  sent: 'all' | 'sent' | 'unsent'
}

export const defaultFilters: Filters = {
  search: '',
  category: '',
  minVisitors: 0,
  collabMailOnly: false,
  recommendedOnly: false,
  sent: 'all',
}

export function applyFilters(list: Blogger[], f: Filters): Blogger[] {
  const q = f.search.trim().toLowerCase()
  return list.filter(
    (b) =>
      (!q || b.name.toLowerCase().includes(q) || b.id.includes(q)) &&
      (!f.category || b.category === f.category) &&
      (f.minVisitors <= 0 || (b.todayVisitors ?? 0) >= f.minVisitors) &&
      (!f.collabMailOnly || b.collabMail) &&
      (!f.recommendedOnly || b.recommended) &&
      (f.sent === 'all' || (f.sent === 'sent' ? b.sent : !b.sent)),
  )
}

export type Summary = {
  total: number
  recommended: number
  collabMail: number
  sent: number
  positiveReplies: number
  /** 긍정 회신 / 발송. 발송이 0이면 null */
  replyRate: number | null
}

export function summarize(list: Blogger[]): Summary {
  const sent = list.filter((b) => b.sent).length
  const positiveReplies = list.filter((b) => b.reply.includes('긍정')).length
  return {
    total: list.length,
    recommended: list.filter((b) => b.recommended).length,
    collabMail: list.filter((b) => b.collabMail).length,
    sent,
    positiveReplies,
    replyRate: sent === 0 ? null : positiveReplies / sent,
  }
}

export function categories(list: Blogger[]): string[] {
  return [...new Set(list.map((b) => b.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'))
}
