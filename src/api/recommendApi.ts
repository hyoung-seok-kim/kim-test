import type { RecommendApi } from '../lib/recommend'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body
}

export const recommendApi: RecommendApi = {
  candidates: (keyword, variant) =>
    get(`/api/candidates?q=${encodeURIComponent(keyword)}&v=${variant}`),
  async check(ids) {
    const { results } = await get<{ results: Awaited<ReturnType<RecommendApi['check']>> }>(
      `/api/check?ids=${ids.map(encodeURIComponent).join(',')}`,
    )
    return results
  },
}
