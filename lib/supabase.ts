import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !anon) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side (browser)
export const supabase = createClient(url, anon)

// Server-side only (API routes) — bypasses RLS
export const supabaseAdmin = url && service
  ? createClient(url, service)
  : createClient(url, anon)
