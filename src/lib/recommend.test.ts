import { describe, expect, it } from 'vitest'
import type { BlogCheck, CheckResult } from '../types'
import { meets, newSession, recommend, type RecommendApi } from './recommend'

const blog = (id: string, v: number, mail: boolean): BlogCheck => ({
  id, name: id, todayVisitors: v, neighbors: 100, totalVisitors: 1000,
  emails: mail ? [`${id}@naver.com`] : [], collabMail: mail, intro: '',
})

/** 조합마다 후보 ID 목록과, ID 별 검사 결과를 돌려주는 가짜 API */
const fakeApi = (variants: string[][], data: Record<string, CheckResult>) => {
  const calls = { candidates: 0, check: [] as string[][] }
  const api: RecommendApi = {
    async candidates(_k, v) {
      calls.candidates += 1
      return { variants: variants.length, ids: variants[v] ?? [] }
    },
    async check(ids) {
      calls.check.push(ids)
      return ids.map((id) => data[id] ?? { id, error: 'x' })
    },
  }
  return { api, calls }
}

const crit = { keyword: '올리브영', minVisitors: 100, collabMailOnly: true }

describe('조건 판정', () => {
  it('방문자·메일 조건을 함께 본다', () => {
    expect(meets(blog('a', 150, true), crit)).toBe(true)
    expect(meets(blog('a', 50, true), crit)).toBe(false)
    expect(meets(blog('a', 150, false), crit)).toBe(false)
    expect(meets(blog('a', 150, false), { ...crit, collabMailOnly: false })).toBe(true)
    expect(meets({ ...blog('a', 0, true), todayVisitors: null }, crit)).toBe(false)
  })
})

describe('추천 진행', () => {
  const data: Record<string, CheckResult> = {
    a: blog('a', 500, true), b: blog('b', 50, true), c: blog('c', 500, false),
    d: blog('d', 300, true), e: blog('e', 900, true), f: blog('f', 120, true),
  }

  it('조건에 맞는 인원만 채우고 멈춘다', async () => {
    const { api } = fakeApi([['a', 'b', 'c', 'd', 'e', 'f']], data)
    const r = await recommend(api, crit, newSession(), new Set(), 2)
    expect(r.map((x) => x.id)).toEqual(['a', 'd'])
  })

  it('남는 적합 후보는 다음 호출에서 이어서 쓴다', async () => {
    const { api } = fakeApi([['a', 'b', 'c', 'd', 'e', 'f']], data)
    const s = newSession()
    const first = await recommend(api, crit, s, new Set(), 2)
    const second = await recommend(api, crit, s, new Set(first.map((x) => x.id)), 2)
    expect(second.map((x) => x.id)).toEqual(['e', 'f'])
  })

  it('이미 추천한 블로거는 제외한다', async () => {
    const { api } = fakeApi([['a', 'd', 'e']], data)
    const r = await recommend(api, crit, newSession(), new Set(['a', 'd']), 5)
    expect(r.map((x) => x.id)).toEqual(['e'])
  })

  it('후보가 부족하면 다음 검색 조합으로 넘어가고, 모두 소진되면 있는 만큼만 돌려준다', async () => {
    const { api, calls } = fakeApi([['a', 'b'], ['b', 'c', 'd']], data)
    const s = newSession()
    const r = await recommend(api, crit, s, new Set(), 10)
    expect(r.map((x) => x.id)).toEqual(['a', 'd'])
    expect(s.exhausted).toBe(true)
    expect(calls.candidates).toBe(2)
    // 같은 블로거(b)를 두 번 검사하지 않는다
    expect(calls.check.flat().filter((id) => id === 'b')).toHaveLength(1)
  })

  it('검사에 실패한 블로거는 건너뛴다', async () => {
    const { api } = fakeApi([['zzz', 'a']], data)
    expect((await recommend(api, crit, newSession(), new Set(), 5)).map((x) => x.id)).toEqual(['a'])
  })

  it('중단 신호를 받으면 멈춘다', async () => {
    const { api } = fakeApi([['a', 'd']], data)
    const ac = new AbortController()
    ac.abort()
    expect(await recommend(api, crit, newSession(), new Set(), 5, undefined, ac.signal)).toEqual([])
  })
})
