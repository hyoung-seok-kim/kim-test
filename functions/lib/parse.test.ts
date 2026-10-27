import { describe, expect, it } from 'vitest'
import {
  blogId, mergeRecommendedOnly, parseBloggers, parseRecommended, parseSettings, toDate, toNumber,
} from './parse'

// 실제 시트(2026-10-27)에서 가져온 행. 뒤쪽 빈 셀은 Sheets API 가 생략한다.
const LIST = [
  ['No', '블로그명', '블로그 링크', '오늘 방문자 수', '이웃 수', '최근 포스팅일', '주요 카테고리', '협업 메일 공개', '조건 충족', '검토 결과', '발송 여부', '발송일', '회신', '메모'],
  ['1', '하늘여우의 하늘바라기', 'https://blog.naver.com/skyfox_1004', '133', '4,203', '2026-10-25', '맛집', 'X', '충족', '', 'FALSE'],
  ['7', 'Lauren Beauty', 'https://blog.naver.com/layeonparkgogo', '6,774', '8,057', '2026-10-25', '뷰티', 'O', '충족', '', 'FALSE'],
]
const REC = [
  ['No', '블로그명', '블로그 링크', '오늘 방문자 수', '이웃 수', '최근 포스팅일', '주요 카테고리', '협업 메일 공개', '올리브영 관련 근거'],
  ['1', '아블랑', 'https://blog.naver.com/aablanc', '19702', '11635', '2026-10-26', '뷰티', 'O', '최근 글 30개 중 올리브영 언급 7건 (예: ...)'],
  ['7', 'Lauren Beauty', 'https://blog.naver.com/LayeonParkgogo', '6774', '8057', '2026-10-25', '뷰티', 'O', '최근 글 30개 중 올리브영 언급 12건 (예: ...)'],
]

describe('값 변환', () => {
  it('쉼표 포함 숫자와 비공개를 처리한다', () => {
    expect(toNumber('4,203')).toBe(4203)
    expect(toNumber('')).toBeNull()
    expect(toNumber('비공개')).toBeNull()
  })
  it('날짜를 YYYY-MM-DD 로 통일한다', () => {
    expect(toDate('2026.10.5')).toBe('2026-10-05')
    expect(toDate('없음')).toBeNull()
  })
  it('블로그 ID 를 소문자로 뽑는다', () => {
    expect(blogId('https://blog.naver.com/LayeonParkgogo?x=1')).toBe('layeonparkgogo')
  })
})

describe('시트 파싱', () => {
  const rec = parseRecommended(REC)
  const bloggers = mergeRecommendedOnly(parseBloggers(LIST, rec), REC)

  it('원본 행을 정제하고 추천 정보를 대소문자 무관하게 병합한다', () => {
    const lauren = bloggers.find((b) => b.id === 'layeonparkgogo')!
    expect(lauren).toMatchObject({ todayVisitors: 6774, neighbors: 8057, collabMail: true, recommended: true, oliveyoungMentions: 12 })
    const sky = bloggers.find((b) => b.id === 'skyfox_1004')!
    expect(sky).toMatchObject({ neighbors: 4203, collabMail: false, sent: false, recommended: false })
  })
  it('추천 탭에만 있는 블로거도 포함한다', () => {
    expect(bloggers.map((b) => b.id)).toContain('aablanc')
    expect(bloggers).toHaveLength(3)
  })
  it('필수 헤더가 없으면 에러', () => {
    expect(() => parseBloggers([['이름', '주소']], new Map())).toThrow('블로그명')
  })
  it('설정 탭을 읽는다', () => {
    const s = parseSettings([['설정 및 요약'], [], ['최소 방문자 수', '100'], ['검색 키워드', '올리브영'], ['한 번에 수집할 인원(명)', '50']])
    expect(s).toEqual({ minVisitors: 100, keyword: '올리브영', batchSize: 50 })
  })
})
