export interface Env {
  SPREADSHEET_ID: string
  GOOGLE_SERVICE_ACCOUNT_JSON: string
}

type ServiceAccount = { client_email: string; private_key: string }

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signJwt(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )
  const pem = sa.private_key
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`))
  return `${header}.${claim}.${b64url(sig)}`
}

async function accessToken(env: Env): Promise<string> {
  let sa: ServiceAccount
  try {
    sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 이 올바른 JSON 이 아닙니다')
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await signJwt(sa),
    }),
  })
  if (!res.ok) throw new Error(`Google 토큰 발급 실패 (${res.status})`)
  return ((await res.json()) as { access_token: string }).access_token
}

/** 여러 범위를 한 번에 읽는다. 반환 순서는 ranges 와 같다. */
export async function batchGet(env: Env, ranges: string[]): Promise<string[][][]> {
  const token = await accessToken(env)
  const qs = new URLSearchParams()
  ranges.forEach((r) => qs.append('ranges', r))
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values:batchGet?${qs}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Sheets API 오류 (${res.status}): ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { valueRanges: { values?: string[][] }[] }
  return json.valueRanges.map((v) => v.values ?? [])
}
