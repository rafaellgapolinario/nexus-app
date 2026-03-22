import { NextRequest, NextResponse } from 'next/server'
import { upsertUser, upsertSettings, addActivityLog } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { googleId, nome, email, avatar } = body

    console.log('Auth request:', { googleId, email })

    if (!googleId || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Check env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const user = await upsertUser({ google_id: googleId, nome, email, avatar })
    console.log('User upserted:', user?.id)

    await upsertSettings(user.id, {})
    await addActivityLog(user.id, `Login: ${email}`)

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
