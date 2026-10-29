export const MAX_KEYWORDS = 5

/** 쉼표·줄바꿈으로 구분한 키워드 입력을 정리한다. 공백 제거, 중복 제거, 최대 MAX_KEYWORDS 개. */
export function parseKeywords(input: string): string[] {
  const seen = new Set<string>()
  for (const raw of input.split(/[,，\n]/)) {
    const k = raw.trim().replace(/\s+/g, ' ')
    if (k && k.length <= 50) seen.add(k)
  }
  return [...seen].slice(0, MAX_KEYWORDS)
}
