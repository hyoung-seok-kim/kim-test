import { describe, expect, it } from 'vitest'
import { parseBlogHome } from './naverBlog'

// 2026-10-29 m.blog.naver.com/bbobagi 응답에서 필요한 부분만 남긴 조각
const HTML =
  '..."blogName":"BBOBAGI PICK","dayVisitorCount":397,"subscriberCount":3696,"totalVisitorCount":1707749,"block":false...' +
  '"dataKey":"bbobagi","data":{"introduce":"셀럽 패션 협찬&문의 qkralswn45@naver.com","phoneNumber":""}'

describe('네이버 블로그 홈 파싱', () => {
  it('방문자·이웃·소개글 이메일을 읽는다', () => {
    expect(parseBlogHome('bbobagi', HTML)).toMatchObject({
      id: 'bbobagi', name: 'BBOBAGI PICK', todayVisitors: 397, neighbors: 3696, totalVisitors: 1707749,
      emails: ['qkralswn45@naver.com'], collabMail: true,
    })
  })
  it('소개글에 이메일이 없으면 공개 아님', () => {
    const html = '"dayVisitorCount":10,"subscriberCount":5,"introduce":"안녕하세요 일상 블로그"'
    expect(parseBlogHome('x', html)).toMatchObject({ collabMail: false, emails: [] })
  })
  it('페이지를 읽지 못하면 null 로 둔다', () => {
    expect(parseBlogHome('x', '')).toMatchObject({ todayVisitors: null, neighbors: null, collabMail: false })
  })
  it('.com 을 뺀 포털 주소도 이메일로 본다', () => {
    const html = '"introduce":"문의 ✔️lovelyy3y@naver"'
    expect(parseBlogHome('x', html)).toMatchObject({ emails: ['lovelyy3y@naver'], collabMail: true })
  })
  it('포털 이름으로 시작하는 다른 도메인은 전체를 잡는다', () => {
    expect(parseBlogHome('x', '"introduce":"a@navercorp.co.kr"').emails).toEqual(['a@navercorp.co.kr'])
  })
  it('이스케이프된 소개글도 해석한다', () => {
    const html = '"introduce":"문의\\n a.b@c.co.kr \\u002F 감사"'
    expect(parseBlogHome('x', html).emails).toEqual(['a.b@c.co.kr'])
  })
})
