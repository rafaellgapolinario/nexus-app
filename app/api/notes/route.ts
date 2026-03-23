import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/db'

export const runtime = 'nodejs'

async function getUserId(req: NextRequest) {
  const email = req.headers.get('x-user-email')
  if (!email) return null
  const user = await getUserByEmail(email)
  return user?.id || null
}

// GET — list notes
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })

  return NextResponse.json({ notes: data || [] })
}

// POST — create note
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tipo = 'nota', titulo, conteudo, lembrete_em, cor } = body

  if (!conteudo) return NextResponse.json({ error: 'Missing conteudo' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert({ user_id: userId, tipo, titulo, conteudo, lembrete_em, cor })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

// PATCH — update note (toggle concluido, edit)
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('notes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — delete note
export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
