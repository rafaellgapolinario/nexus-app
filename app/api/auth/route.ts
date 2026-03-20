import { NextRequest, NextResponse } from 'next/server'
import { upsertUser, upsertSettings, addActivityLog } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { googleId, nome, email, avatar } = await req.json()
    if (!googleId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    const user = await upsertUser({ google_id: googleId, nome, email, avatar })
    await upsertSettings(user.id, {})
    await addActivityLog(user.id, `Login: ${email}`)
    return NextResponse.json({ user })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
