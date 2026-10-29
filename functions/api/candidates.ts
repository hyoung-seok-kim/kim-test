import { SEARCH_VARIANTS, searchBlogIds } from '../lib/naverSearch'

/** 키워드의 검색 조합(v)별 후보 블로그 ID. 외부 호출 1회. */
export const onRequestGet: PagesFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const q = (params.get('q') ?? '').trim()
  const v = Number(params.get('v') ?? 0)
  if (!q || q.length > 50) return Response.json({ error: '키워드는 1~50자로 입력하세요' }, { status: 400 })
  if (!Number.isInteger(v) || v < 0 || v >= SEARCH_VARIANTS.length) {
    return Response.json({ error: '잘못된 검색 조합입니다' }, { status: 400 })
  }

  const { status, ids } = await searchBlogIds(q, v)
  if (status !== 200) return Response.json({ error: `네이버 검색 응답 오류 (${status})` }, { status: 502 })
  return Response.json({ variants: SEARCH_VARIANTS.length, ids })
}
