import { NextRequest, NextResponse } from 'next/server'
import { getActivityLogs } from '@/lib/db'

export const runtime = 'nodejs'

const OWNER = process.env.NEXT_PUBLIC_OWNER_EMAIL!

export async function GET(req: NextRequest) {
  if (req.headers.get('x-owner-email') !== OWNER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const logs = await getActivityLogs(100)
  return NextResponse.json({ logs })
}
