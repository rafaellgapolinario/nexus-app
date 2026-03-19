'use client'
import type { CalendarEvent } from '@/lib/types'
import { formatEventTime, formatEventDate } from '@/lib/calendar'
import { useStore } from '@/lib/store'

const LOCALE_MAP = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export function EventList({ events, emptyMsg }: { events: CalendarEvent[]; emptyMsg: string }) {
  const lang = useStore(s => s.lang)
  const locale = LOCALE_MAP[lang]

  if (!events.length) return <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)', fontSize: 14 }}>{emptyMsg}</div>

  return (
    <div>
      {events.map(ev => (
        <div key={ev.id} className="event-card">
          <div className="event-time">{formatEventTime(ev, locale)}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{ev.summary || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
              {formatEventDate(ev, locale)}{ev.location ? ` · ${ev.location}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
