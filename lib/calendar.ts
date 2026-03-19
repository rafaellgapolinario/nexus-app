import type { CalendarEvent } from './types'

const BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export async function loadTodayEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  const res = await fetch(`${BASE}?timeMin=${todayStart}&timeMax=${todayEnd}&singleEvents=true&orderBy=startTime&maxResults=10`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Calendar error')
  const data = await res.json()
  return data.items || []
}

export async function loadUpcomingEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  const weekEnd  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const res = await fetch(`${BASE}?timeMin=${todayEnd}&timeMax=${weekEnd}&singleEvents=true&orderBy=startTime&maxResults=8`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Calendar error')
  const data = await res.json()
  return data.items || []
}

export async function createEvent(token: string, title: string, start: string, end: string, location?: string): Promise<boolean> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: title,
      location,
      start: { dateTime: new Date(start).toISOString(), timeZone: tz },
      end:   { dateTime: new Date(end).toISOString(),   timeZone: tz },
    }),
  })
  return res.ok
}

export function formatEventTime(ev: CalendarEvent, locale: string): string {
  if (!ev.start.dateTime) return locale.startsWith('en') ? 'All day' : locale.startsWith('es') ? 'Todo el día' : 'Dia todo'
  return new Date(ev.start.dateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export function formatEventDate(ev: CalendarEvent, locale: string): string {
  if (!ev.start.dateTime) return ''
  return new Date(ev.start.dateTime).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}
