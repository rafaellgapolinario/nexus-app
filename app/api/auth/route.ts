import { NextRequest, NextResponse } from 'next/server'
import { upsertUser, upsertSettings, addActivityLog } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { googleId, nome, email, avatar } = await req.json()
    if (!googleId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Upsert user in Supabase
    const user = await upsertUser({ google_id: googleId, nome, email, avatar })

    // Create default settings if not exists
    await upsertSettings(user.id, {})

    // Log activity
    await addActivityLog(user.id, 'login', { email })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
