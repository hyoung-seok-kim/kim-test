import type { BlogCheck, CheckResult } from '../types'

export type Criteria = {
  keyword: string
  minVisitors: number
  collabMailOnly: boolean
}

export type RecommendApi = {
  candidates(keyword: string, variant: number): Promise<{ variants: number; ids: string[] }>
  check(ids: string[]): Promise<CheckResult[]>
}

/** "더 받기"를 눌러도 이어서 진행하도록, 검색 조합 위치와 아직 안 본 후보를 들고 있는다. */
export type Session = {
  variant: number
  variants: number
  queue: string[]
  /** 이번 세션에서 이미 검사한 ID. 다시 읽지 않는다. */
  checked: Set<string>
  exhausted: boolean
}

export const newSession = (): Session => ({ variant: 0, variants: Infinity, queue: [], checked: new Set(), exhausted: false })

const CHUNK = 20

export const meets = (b: BlogCheck, c: Criteria): boolean =>
  (b.todayVisitors ?? 0) >= c.minVisitors && (!c.collabMailOnly || b.collabMail)

export type Progress = { checked: number; found: number; variant: number }

/**
 * 조건에 맞는 블로거를 want 명 채울 때까지 후보를 검색·검사한다.
 * exclude 는 이미 추천한 블로거 ID. 후보가 바닥나면 exhausted 로 표시하고 찾은 만큼만 돌려준다.
 */
export async function recommend(
  api: RecommendApi,
  criteria: Criteria,
  session: Session,
  exclude: Set<string>,
  want: number,
  onProgress?: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<BlogCheck[]> {
  const found: BlogCheck[] = []

  while (found.length < want && !signal?.aborted) {
    if (session.queue.length === 0) {
      if (session.variant >= session.variants) {
        session.exhausted = true
        break
      }
      const { variants, ids } = await api.candidates(criteria.keyword, session.variant)
      session.variants = variants
      session.variant += 1
      session.queue = ids.filter((id) => !session.checked.has(id) && !exclude.has(id))
      continue
    }

    const chunk = session.queue.splice(0, CHUNK)
    chunk.forEach((id) => session.checked.add(id))
    for (const r of await api.check(chunk)) {
      if ('error' in r) continue
      if (found.length < want && meets(r, criteria)) found.push(r)
      else if (meets(r, criteria)) {
        // 목표 인원을 넘은 적합 블로거는 다음 "더 받기"에서 쓰도록 되돌려 놓는다.
        session.checked.delete(r.id)
        session.queue.push(r.id)
      }
    }
    onProgress?.({ checked: session.checked.size, found: found.length, variant: session.variant })
  }
  return found
}
