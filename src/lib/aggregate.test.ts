import { describe, expect, it } from 'vitest'
import { sampleResponse } from '../mock/sample'
import { applyFilters, categories, defaultFilters, summarize } from './aggregate'

const all = sampleResponse.bloggers

describe('집계·필터', () => {
  it('요약 수치를 계산한다', () => {
    const s = summarize(all)
    expect(s.total).toBe(all.length)
    expect(s.sent).toBe(2)
    expect(s.positiveReplies).toBe(1)
    expect(s.replyRate).toBe(0.5)
  })
  it('발송이 없으면 회신율은 null', () => {
    expect(summarize([]).replyRate).toBeNull()
  })
  it('필터를 조합한다', () => {
    const r = applyFilters(all, { ...defaultFilters, category: '뷰티', collabMailOnly: true, minVisitors: 2000 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((b) => b.category === '뷰티' && b.collabMail && (b.todayVisitors ?? 0) >= 2000)).toBe(true)
  })
  it('이름·ID 로 검색한다', () => {
    expect(applyFilters(all, { ...defaultFilters, search: 'lauren' }).map((b) => b.id)).toEqual(['layeonparkgogo'])
  })
  it('카테고리 목록은 중복 없이 정렬된다', () => {
    const c = categories(all)
    expect(new Set(c).size).toBe(c.length)
  })
})
