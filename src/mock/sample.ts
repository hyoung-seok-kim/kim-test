import type { Blogger, BloggersResponse } from '../types'

// 실제 시트(2026-10-27) 일부로 만든 개발용 샘플. API 키 없이 화면을 볼 때만 쓴다 (?mock=1).
type Raw = [string, string, number | null, number, string, string, boolean]
const list: Raw[] = [
  ['skyfox_1004', '하늘여우의 하늘바라기', 133, 4203, '2026-10-25', '맛집', false],
  ['control555', '생활과 경제 사이', 159, 33, '2026-10-25', '생활', false],
  ['bbobagi', 'BBOBAGI PICK', 554, 3695, '2026-10-24', '패션', true],
  ['momdreamz', '결이언니의 피부습관', 376, 2228, '2026-10-25', '뷰티', true],
  ['milk_teeeea', '밀크티 하우스', 2738, 5229, '2026-10-24', '리뷰', false],
  ['dieat_a_t', '호나의 성장기', 155, 1929, '2026-10-25', '인테리어', true],
  ['layeonparkgogo', 'Lauren Beauty', 6774, 8057, '2026-10-25', '뷰티', true],
  ['4726765', '미블리 TODAY', 411, 4230, '2026-10-25', '리뷰', false],
  ['kkamsun8573', '또롬', 824, 253, '2026-10-25', '여행', false],
  ['nkdw2006', '오늘의 뚬', 212, 1314, '2026-10-25', '뷰티', true],
  ['hellodany_', '헬로다니', 941, 9917, '2026-10-23', '뷰티', true],
  ['higo1404', '리뽀 뷰티', 352, 7146, '2026-10-25', '뷰티', true],
  ['under123123', '일상최적화', 1262, 5780, '2026-10-25', '연예', false],
  ['s1996129s', '취향이 머무는 일상', 1069, 3171, '2026-10-24', '육아', true],
  ['euni4441', '평범한 오늘, 특별한 로지Pick !', 2075, 13221, '2026-10-25', '뷰티', true],
  ['lovelifelive2', '올리브숲의 이모저모', 2071, 3825, '2026-10-25', '뷰티', true],
  ['cassie1031', '까시발라주는 부부', 212, 9741, '2026-10-25', '맛집', false],
  ['hidden_blog', '방문자 비공개 예시', null, 800, '2026-10-20', '뷰티', true],
]

const rec: Record<string, [string, number, number, number, string, string]> = {
  aablanc: ['아블랑의 예뻐지는 뷰티패션 꿀팁!', 19702, 11635, 7, '2026-10-26', '올리브영 먹는콜라겐 추천템! 비비랩 석류콜라겐S 이너뷰티 후기'],
  wkfka88: ['✨️야토언니✨️', 6690, 5869, 12, '2026-10-25', '올리브영 립밤 추천 버츠비 컬러립밤 후기'],
  lovedarl2: ['뷰스타 달콤달 뷰티&뷰티', 2199, 9411, 8, '2026-10-26', '가을 향수 추천 3가지, 올리브영 바닐라 머스크향 향수'],
  greenshoo46: ['쥬아뷰티', 2155, 5082, 8, '2026-10-22', '올리브영 클렌징폼 추천 한율 어린쑥 쑥떡팩폼 후기'],
  layeonparkgogo: ['Lauren Beauty', 6774, 8057, 9, '2026-10-25', '올리브영 신상 쿠션 비교 후기'],
  euni4441: ['평범한 오늘, 특별한 로지Pick !', 2075, 13221, 5, '2026-10-25', '올리브영 세일 추천템 정리'],
}

const base = (id: string, name: string): Blogger => ({
  id, name, url: `https://blog.naver.com/${id}`, todayVisitors: null, neighbors: null, lastPostDate: null,
  category: '', collabMail: false, meetsCondition: false, review: '', sent: false, sentDate: null,
  reply: '', memo: '', oliveyoungMentions: null, evidence: null, recommended: false,
})

const bloggers: Blogger[] = list.map(([id, name, v, n, d, c, mail], i) => {
  const r = rec[id]
  return {
    ...base(id, name), todayVisitors: v, neighbors: n, lastPostDate: d, category: c, collabMail: mail,
    meetsCondition: v === null || v >= 100,
    sent: i === 6 || i === 15, sentDate: i === 6 || i === 15 ? '2026-10-26' : null,
    reply: i === 6 ? '긍정' : '',
    oliveyoungMentions: r?.[3] ?? null,
    evidence: r ? `최근 글 30개 중 올리브영 언급 ${r[3]}건 (예: ${r[5]})` : null,
    recommended: !!r,
  }
})
for (const [id, [name, v, n, m, d, ex]] of Object.entries(rec)) {
  if (bloggers.some((b) => b.id === id)) continue
  bloggers.push({
    ...base(id, name), todayVisitors: v, neighbors: n, lastPostDate: d, category: '뷰티', collabMail: true,
    oliveyoungMentions: m, evidence: `최근 글 30개 중 올리브영 언급 ${m}건 (예: ${ex})`, recommended: true,
  })
}

export const sampleResponse: BloggersResponse = {
  bloggers,
  settings: { minVisitors: 100, keyword: '올리브영', batchSize: 50 },
  fetchedAt: new Date().toISOString(),
}
