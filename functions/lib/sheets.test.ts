import { afterEach, expect, it, vi } from 'vitest'
import { batchGet } from './sheets'

afterEach(() => vi.unstubAllGlobals())

it('서비스 계정 JWT 를 서명해 토큰을 받고 시트를 읽는다', async () => {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey))
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der))}\n-----END PRIVATE KEY-----\n`

  const calls: string[] = []
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    calls.push(input)
    if (input.startsWith('https://oauth2.googleapis.com/token')) {
      const assertion = new URLSearchParams(init!.body as URLSearchParams).get('assertion')!
      expect(assertion.split('.')).toHaveLength(3)
      return Response.json({ access_token: 'tok' })
    }
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    return Response.json({ valueRanges: [{ values: [['a']] }, {}] })
  })

  const out = await batchGet(
    { SPREADSHEET_ID: 'sid', GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'x@y.iam', private_key: pem }) },
    ['A:B', 'C:D'],
  )
  expect(out).toEqual([[['a']], []])
  expect(calls[1]).toContain('/spreadsheets/sid/values:batchGet')
}, 20000)
