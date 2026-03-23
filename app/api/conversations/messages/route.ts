import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const email = req.headers.get('x-user-email')
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUserByEmail(email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { conversation_id, role, conteudo } = await req.json()
  const { error } = await supabaseAdmin.from('messages').insert({
    conversation_id, user_id: user.id, role, conteudo
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const email = req.headers.get('x-user-email')
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const convId = url.searchParams.get('conversation_id')
  if (!convId) return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 })
  const { data } = await supabaseAdmin
    .from('messages').select('*')
    .eq('conversation_id', convId)
    .order('criado_em', { ascending: true })
  return NextResponse.json({ messages: data || [] })
}
