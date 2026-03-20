import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, updateUserPlan, deleteUser, insertUserManual, addActivityLog } from '@/lib/db'
import type { Plan } from '@/lib/types'

export const runtime = 'nodejs'

const OWNER = process.env.NEXT_PUBLIC_OWNER_EMAIL!

function isOwner(req: NextRequest) {
  return req.headers.get('x-owner-email') === OWNER
}

// GET — list all users
export async function GET(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await getAllUsers()
  return NextResponse.json({ users })
}

// POST — add user manually
export async function POST(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { nome, email, plano } = await req.json()
  if (!nome || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await insertUserManual({ nome, email, plano: plano || 'free' })
  await addActivityLog(null, `Usuário adicionado manualmente: ${email} (${plano})`)
  return NextResponse.json({ ok: true })
}

// PATCH — update plan
export async function PATCH(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, plano, email, oldPlan } = await req.json()
  await updateUserPlan(userId, plano as Plan)
  await addActivityLog(userId, `Plano alterado: ${oldPlan} → ${plano}`, { email })
  return NextResponse.json({ ok: true })
}

// DELETE — remove user
export async function DELETE(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, email } = await req.json()
  await deleteUser(userId)
  await addActivityLog(null, `Usuário removido: ${email}`)
  return NextResponse.json({ ok: true })
}
