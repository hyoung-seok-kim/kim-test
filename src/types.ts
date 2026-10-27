export type Blogger = {
  id: string
  name: string
  url: string
  todayVisitors: number | null
  neighbors: number | null
  lastPostDate: string | null
  category: string
  collabMail: boolean
  meetsCondition: boolean
  review: string
  sent: boolean
  sentDate: string | null
  reply: string
  memo: string
  oliveyoungMentions: number | null
  evidence: string | null
  recommended: boolean
}

export type Settings = {
  minVisitors: number | null
  keyword: string
  batchSize: number | null
}

export type BloggersResponse = {
  bloggers: Blogger[]
  settings: Settings
  fetchedAt: string
}
