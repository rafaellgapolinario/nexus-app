'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { EventList } from '@/components/EventList'
import { EventModal } from '@/components/EventModal'
import type { CalendarEvent } from '@/lib/types'

export default function CalendarPage() {
  const { lang, accessToken, showToast } = useStore(s => ({ lang: s.lang, accessToken: s.accessToken, showToast: s.showToast }))
  const [todayEvents,    setTodayEvents]    = useState<CalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading,   setLoading]   = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/calendar?type=today',    { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/calendar?type=upcoming', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setTodayEvents(d1.items || [])
      setUpcomingEvents(d2.items || [])
    } catch { showToast(t(lang, 'err_connect')) }
    setLoading(false)
  }

  useEffect(() => { load() }, [accessToken])

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>{t(lang, 'nav_calendar')}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t(lang, 'cal_sub')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
              {loading ? '⏳' : '🔄'} Sync
            </button>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowModal(true)}>
              {t(lang, 'btn_newevent')}
            </button>
          </div>
        </div>

        <div className="sec">{t(lang, 'sec_today')}</div>
        <div className="card">
          {loading ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>{t(lang, 'loading')}</div>
            : <EventList events={todayEvents} emptyMsg={t(lang, 'no_events_today')} />}
        </div>

        <div className="sec">{t(lang, 'sec_upcoming')}</div>
        <div className="card">
          {loading ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>{t(lang, 'loading')}</div>
            : <EventList events={upcomingEvents} emptyMsg={t(lang, 'no_events_upcoming')} />}
        </div>
      </div>
      {showModal && <EventModal onClose={() => setShowModal(false)} onCreated={load} />}
    </AppShell>
  )
}
