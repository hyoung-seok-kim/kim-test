import { describe, expect, it } from 'vitest'
import { extractBlogIds, SEARCH_VARIANTS } from './naverSearch'

describe('검색 결과에서 블로그 ID 추출', () => {
  it('게시글 주소의 블로그 ID 만 순서대로, 중복 없이 뽑는다', () => {
    const html = `
      <a href="https://blog.naver.com/BBobagi/224012345678">글1</a>
      <a href="https://blog.naver.com/momdreamz/223999999999?x=1">글2</a>
      <a href="https://blog.naver.com/bbobagi/224000000001">글3</a>
      <a href="https://blog.naver.com/PostList.naver?blogId=zzz">목록</a>
      <a href="https://blog.naver.com/MyBlog.naver">내 블로그</a>`
    expect(extractBlogIds(html)).toEqual(['bbobagi', 'momdreamz'])
  })
  it('결과가 없으면 빈 배열', () => {
    expect(extractBlogIds('<html></html>')).toEqual([])
  })
  it('검색 조합은 중복이 없다', () => {
    expect(new Set(SEARCH_VARIANTS).size).toBe(SEARCH_VARIANTS.length)
  })
})
