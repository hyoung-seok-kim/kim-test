import { describe, expect, it } from 'vitest'
import type { Recommended } from '../types'
import { toCsv } from './recStore'

const r: Recommended = {
  id: 'a', name: '이름, "따옴표"', url: 'https://blog.naver.com/a', todayVisitors: 120, neighbors: 3000,
  totalVisitors: 10, emails: ['a@naver.com', 'b@gmail.com'], collabMail: true, intro: '', keyword: '올리브영',
  foundAt: '2026-10-29T01:00:00.000Z',
}

describe('CSV 내보내기', () => {
  it('BOM 과 헤더를 붙이고 쉼표·따옴표를 이스케이프한다', () => {
    const csv = toCsv([r])
    expect(csv.startsWith('﻿블로그명,')).toBe(true)
    expect(csv.split('\r\n')[1]).toBe('"이름, ""따옴표""",https://blog.naver.com/a,120,3000,a@naver.com / b@gmail.com,올리브영,2026-10-29')
  })
  it('빈 목록은 헤더만', () => {
    expect(toCsv([]).split('\r\n')).toHaveLength(1)
  })
})
