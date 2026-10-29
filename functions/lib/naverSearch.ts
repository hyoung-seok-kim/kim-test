const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

/**
 * 검색 결과 한 번에 약 30명만 나오고 페이지 넘기기가 되지 않는다.
 * 대신 정렬(so:r 관련도, so:dd 최신순)과 기간(p:) 조합마다 다른 후보가 나와서, 조합을 순서대로 돌려 후보를 모은다.
 */
export const SEARCH_VARIANTS: string[] = [
  'so:r,p:all',
  'so:dd,p:all',
  'so:r,p:1w',
  'so:r,p:1m',
  'so:dd,p:1w',
  'so:dd,p:1m',
  'so:r,p:3m',
  'so:dd,p:3m',
  'so:r,p:6m',
  'so:r,p:1y',
  'so:r,p:1d',
  'so:dd,p:1d',
]

/** 검색 결과 HTML 에서 게시글 주소(blog.naver.com/{id}/{글번호})의 블로그 ID 를 등장 순서대로 뽑는다. */
export function extractBlogIds(html: string): string[] {
  const seen = new Set<string>()
  for (const m of html.matchAll(/blog\.naver\.com\/([A-Za-z0-9_-]{3,30})\/\d{6,}/g)) {
    seen.add(m[1].toLowerCase())
  }
  return [...seen]
}

export async function searchBlogIds(query: string, variant = 0): Promise<{ status: number; ids: string[] }> {
  const nso = SEARCH_VARIANTS[variant]
  if (!nso) return { status: 400, ids: [] }
  const url =
    `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_opt&query=${encodeURIComponent(query)}` +
    `&nso=${encodeURIComponent(nso)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } })
  return { status: res.status, ids: res.ok ? extractBlogIds(await res.text()) : [] }
}
