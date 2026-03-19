import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { instance, token, clientToken, phone, message } = await req.json()
  if (!instance || !token || !phone || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (clientToken) headers['Client-Token'] = clientToken

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: phone.replace(/\D/g, ''), message }),
    })
    if (!res.ok) throw new Error('Z-API error')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
