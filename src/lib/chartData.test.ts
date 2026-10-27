import { describe, expect, it } from 'vitest'
import { sampleResponse } from '../mock/sample'
import { categoryCounts, funnel, scatterData } from './chartData'

const all = sampleResponse.bloggers

describe('차트 데이터', () => {
  it('카테고리를 많은 순으로 센다', () => {
    const c = categoryCounts(all)
    expect(c.reduce((s, x) => s + x.count, 0)).toBe(all.length)
    expect(c[0].count).toBeGreaterThanOrEqual(c[c.length - 1].count)
  })
  it('산점도에서 비공개 방문자는 제외한다', () => {
    const s = scatterData(all)
    expect(s.recommended.length + s.others.length).toBe(all.length - 1)
  })
  it('퍼널은 수집 수와 같은 값으로 시작한다', () => {
    const f = funnel(all)
    expect(f[0]).toEqual({ name: '수집', count: all.length })
    expect(f.map((x) => x.name)).toEqual(['수집', '올영 추천', '협업 메일 공개', '발송', '긍정 회신'])
  })
})
