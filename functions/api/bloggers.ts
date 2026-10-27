import type { BloggersResponse } from '../../src/types'
import { batchGet, type Env } from '../lib/sheets'
import { mergeRecommendedOnly, parseBloggers, parseRecommended, parseSettings } from '../lib/parse'

const CACHE_SECONDS = 120

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const refresh = url.searchParams.has('refresh')
  url.searchParams.delete('refresh')
  const cacheKey = new Request(url.toString())
  const cache = caches.default

  if (!refresh) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }

  if (!env.SPREADSHEET_ID || !env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return Response.json({ error: '서버 환경변수(SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON)가 설정되지 않았습니다' }, { status: 500 })
  }

  try {
    const [list, rec, settings] = await batchGet(env, [
      "'블로거 리스트'!A:N",
      "'추천 블로거'!A:I",
      "'설정 및 요약'!A1:B10",
    ])
    const recommended = parseRecommended(rec)
    const bloggers = mergeRecommendedOnly(parseBloggers(list, recommended), rec)
    const body: BloggersResponse = {
      bloggers,
      settings: parseSettings(settings),
      fetchedAt: new Date().toISOString(),
    }
    const res = Response.json(body, { headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}` } })
    await cache.put(cacheKey, res.clone())
    return res
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
