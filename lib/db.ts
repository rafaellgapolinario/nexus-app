import { supabaseAdmin } from './supabase'
import type { Plan } from './types'

// ── USERS ────────────────────────────────────────────────────
export async function upsertUser(profile: {
  google_id: string
  nome: string
  email: string
  avatar?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(
      { ...profile, ultimo_login: new Date().toISOString() },
      { onConflict: 'google_id', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  return data
}

export async function getAllUsers() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('criado_em', { ascending: false })
  return data || []
}

export async function updateUserPlan(userId: string, plano: Plan) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ plano })
    .eq('id', userId)
  if (error) throw error
}

export async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId)
  if (error) throw error
}

export async function insertUserManual(data: {
  nome: string
  email: string
  plano: Plan
}) {
  const { error } = await supabaseAdmin
    .from('users')
    .insert({
      google_id: `manual_${Date.now()}`,
      nome: data.nome,
      email: data.email,
      plano: data.plano,
    })
  if (error) throw error
}

// ── SETTINGS ─────────────────────────────────────────────────
export async function getSettings(userId: string) {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function upsertSettings(userId: string, settings: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
  if (error) throw error
}

// ── CONVERSATIONS ─────────────────────────────────────────────
export async function getConversations(userId: string) {
  const { data } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('atualizado_em', { ascending: false })
    .limit(20)
  return data || []
}

export async function createConversation(userId: string, titulo = 'Nova conversa') {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: userId, titulo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMessages(conversationId: string) {
  const { data } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('criado_em', { ascending: true })
  return data || []
}

export async function saveMessage(payload: {
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
  conteudo: string
}) {
  const { error } = await supabaseAdmin.from('messages').insert(payload)
  if (error) throw error
}

// ── AUTOMATIONS ───────────────────────────────────────────────
export async function getAutomations(userId: string) {
  const { data } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('user_id', userId)
  return data || []
}

export async function upsertAutomations(userId: string, automations: Record<string, boolean>) {
  const rows = Object.entries(automations).map(([tipo, ativo]) => ({
    user_id: userId, nome: tipo, tipo, ativo,
  }))
  const { error } = await supabaseAdmin
    .from('automations')
    .upsert(rows, { onConflict: 'user_id,tipo', ignoreDuplicates: false })
  if (error) throw error
}

// ── WA USERS ──────────────────────────────────────────────────
export async function getWaUsers(userId: string) {
  const { data } = await supabaseAdmin
    .from('wa_users')
    .select('*')
    .eq('user_id', userId)
  return data || []
}

export async function addWaUser(userId: string, nome: string, telefone: string) {
  const { error } = await supabaseAdmin
    .from('wa_users')
    .insert({ user_id: userId, nome, telefone })
  if (error) throw error
}

export async function removeWaUser(id: string) {
  const { error } = await supabaseAdmin.from('wa_users').delete().eq('id', id)
  if (error) throw error
}

// ── ACTIVITY LOGS ─────────────────────────────────────────────
export async function addActivityLog(userId: string | null, acao: string, detalhes = {}) {
  await supabaseAdmin.from('activity_logs').insert({ user_id: userId, acao, detalhes })
}

export async function getActivityLogs(limit = 50) {
  const { data } = await supabaseAdmin
    .from('activity_logs')
    .select('*, users(nome, email)')
    .order('criado_em', { ascending: false })
    .limit(limit)
  return data || []
}
