import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'today'
  const now = new Date()

  let timeMin: string, timeMax: string
  if (type === 'today') {
    timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  } else {
    timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return NextResponse.json({ error: 'Calendar error' }, { status: res.status })
  const data = await res.json()
  return NextResponse.json({ items: data.items || [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, start, end, location } = await req.json()
  if (!title || !start || !end) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const tz = 'America/Sao_Paulo'
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: title,
      location,
      start: { dateTime: new Date(start).toISOString(), timeZone: tz },
      end:   { dateTime: new Date(end).toISOString(),   timeZone: tz },
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  const event = await res.json()
  return NextResponse.json({ event })
}
