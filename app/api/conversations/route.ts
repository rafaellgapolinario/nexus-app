import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/db'

export const runtime = 'nodejs'

async function getUser(req: NextRequest) {
  const email = req.headers.get('x-user-email')
  if (!email) return null
  return getUserByEmail(email)
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { titulo } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: user.id, titulo: titulo || 'Conversa' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('conversations')
    .select('*, messages(count)')
    .eq('user_id', user.id)
    .order('atualizado_em', { ascending: false })
    .limit(20)
  return NextResponse.json({ conversations: data || [] })
}
