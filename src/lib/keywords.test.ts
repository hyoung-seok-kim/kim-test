import { describe, expect, it } from 'vitest'
import { MAX_KEYWORDS, parseKeywords } from './keywords'

describe('키워드 입력 정리', () => {
  it('쉼표와 줄바꿈으로 나누고 공백을 정리한다', () => {
    expect(parseKeywords(' 올리브영 ,다이소\n  쿠팡   로켓 ')).toEqual(['올리브영', '다이소', '쿠팡 로켓'])
  })
  it('빈 항목과 중복을 없앤다', () => {
    expect(parseKeywords('올리브영,, 올리브영 ,')).toEqual(['올리브영'])
  })
  it('전각 쉼표도 구분자로 본다', () => {
    expect(parseKeywords('가，나')).toEqual(['가', '나'])
  })
  it(`최대 ${MAX_KEYWORDS}개까지만 쓴다`, () => {
    expect(parseKeywords('a,b,c,d,e,f,g')).toHaveLength(MAX_KEYWORDS)
  })
  it('빈 입력은 빈 배열', () => {
    expect(parseKeywords('  , ')).toEqual([])
  })
})
