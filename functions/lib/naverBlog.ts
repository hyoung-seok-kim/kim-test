export type BlogInfo = {
  id: string
  name: string
  todayVisitors: number | null
  neighbors: number | null
  totalVisitors: number | null
  introduce: string
  emails: string[]
  /** 소개글에 이메일이 적혀 있으면 협업 메일 공개로 본다 */
  collabMail: boolean
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

// 주소 끝(.com)을 빼먹고 'id@naver' 로만 적는 블로거가 많아, 주요 포털은 도메인만 있어도 인정한다.
const EMAIL =
  /[A-Za-z0-9._%+-]+@(?:(?:naver|gmail|daum|hanmail|kakao|nate)\b(?:\.[A-Za-z]{2,}){0,2}|[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g

function num(html: string, key: string): number | null {
  const m = html.match(new RegExp(`"${key}":(\\d+)`))
  return m ? Number(m[1]) : null
}

function jsonString(html: string, key: string): string {
  const m = html.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`))
  if (!m) return ''
  try {
    return JSON.parse(`"${m[1]}"`)
  } catch {
    return m[1]
  }
}

/** m.blog.naver.com/{id} 의 HTML 에서 공개 정보를 읽는다. */
export function parseBlogHome(id: string, html: string): BlogInfo {
  const introduce = jsonString(html, 'introduce')
  const emails = [...new Set(introduce.match(EMAIL) ?? [])]
  return {
    id,
    name: jsonString(html, 'blogName') || id,
    todayVisitors: num(html, 'dayVisitorCount'),
    neighbors: num(html, 'subscriberCount'),
    totalVisitors: num(html, 'totalVisitorCount'),
    introduce,
    emails,
    collabMail: emails.length > 0,
  }
}

export async function fetchBlogHome(id: string): Promise<BlogInfo & { status: number }> {
  const res = await fetch(`https://m.blog.naver.com/${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' },
  })
  const html = res.ok ? await res.text() : ''
  return { ...parseBlogHome(id, html), status: res.status }
}
