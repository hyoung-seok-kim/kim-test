export const onRequestGet: PagesFunction = () =>
  Response.json({ ok: true, time: new Date().toISOString() })
