import { fetchBlogHome } from '../lib/naverBlog'

const MAX_IDS = 25 // 무료 플랜은 요청당 외부 호출 50회 제한이라 여유를 둔다
const ID = /^[A-Za-z0-9_-]{3,30}$/

/** 블로그 ID 목록의 방문자·이웃·소개글 이메일. ID 하나당 외부 호출 1회. */
export const onRequestGet: PagesFunction = async ({ request }) => {
  const ids = [
    ...new Set(
      (new URL(request.url).searchParams.get('ids') ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => ID.test(s)),
    ),
  ].slice(0, MAX_IDS)
  if (ids.length === 0) return Response.json({ error: 'ids 가 필요합니다' }, { status: 400 })

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const { introduce, status, ...info } = await fetchBlogHome(id)
        if (status !== 200) return { id, error: `HTTP ${status}` }
        return { ...info, intro: introduce.replace(/\s+/g, ' ').slice(0, 140) }
      } catch {
        return { id, error: 'fetch failed' }
      }
    }),
  )
  return Response.json({ results })
}
