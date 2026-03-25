'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { EventList } from '@/components/EventList'
import { EventModal } from '@/components/EventModal'
import type { CalendarEvent } from '@/lib/types'
import Link from 'next/link'

export default function HomePage() {
  const { lang, accessToken, userProfile, calendarEvents, setCalendarEvents, showToast } = useStore(s => ({
    lang: s.lang, accessToken: s.accessToken, userProfile: s.userProfile,
    calendarEvents: s.calendarEvents, setCalendarEvents: s.setCalendarEvents, showToast: s.showToast,
  }))
  const [todayEvents,    setTodayEvents]    = useState<CalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loadingCal,     setLoadingCal]     = useState(false)
  const [showModal,      setShowModal]      = useState(false)

  async function loadCalendar() {
    if (!accessToken) return
    setLoadingCal(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/calendar?type=today',    { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/calendar?type=upcoming', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setTodayEvents(d1.items || [])
      setUpcomingEvents(d2.items || [])
      setCalendarEvents([...(d1.items || []), ...(d2.items || [])])
    } catch { showToast(t(lang, 'err_connect')) }
    setLoadingCal(false)
  }

  useEffect(() => { if (accessToken) loadCalendar() }, [accessToken])

  const now = new Date()
  const todayStr = now.toDateString()
  const todayEvs = calendarEvents.filter(ev => ev.start.dateTime && new Date(ev.start.dateTime).toDateString() === todayStr)
  const weekEvs  = calendarEvents.filter(ev => { if (!ev.start.dateTime) return false; const d = new Date(ev.start.dateTime); return d >= now && d <= new Date(now.getTime() + 7*24*60*60*1000) })
  let busyMins = 0
  todayEvs.forEach(ev => { if (ev.start.dateTime && ev.end?.dateTime) busyMins += (new Date(ev.end.dateTime).getTime() - new Date(ev.start.dateTime).getTime()) / 60000 })
  const busyHrs = Math.round(busyMins / 60 * 10) / 10
  const freeHrs = Math.max(0, Math.round((8 - busyHrs) * 10) / 10)

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>

        {/* Nexus CTA */}
        <Link href="/nexus" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,rgba(124,109,250,0.15),rgba(124,109,250,0.05))', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20, cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.2s' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(124,109,250,0.4)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--accent2)' }}>⚡ Falar com o Nexus</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Diga "Hey Nexus" · Assistente de voz com IA</div>
          </div>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent2)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>

        {/* Quick actions */}
        <div className="sec">{t(lang, 'sec_quickactions')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '📅', label: t(lang, 'act_newevent'), sub: 'Google Calendar', action: () => setShowModal(true) },
            { icon: '🔄', label: t(lang, 'act_sync'),     sub: 'Google Calendar', action: loadCalendar },
            { icon: '💬', label: t(lang, 'act_whatsapp'), sub: 'Z-API · WhatsApp', href: '/whatsapp' },
            { icon: '⚙️', label: 'Automações',            sub: 'Se X → Faça Y',   href: '/automations' },
          ].map(({ icon, label, sub, action, href }) => (
            href ? (
              <Link key={label} href={href} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{sub}</div>
              </Link>
            ) : (
              <div key={label} onClick={action} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 24 }}>{loadingCal && label === t(lang, 'act_sync') ? '⏳' : icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{sub}</div>
              </div>
            )
          ))}
        </div>

        {/* Dashboard 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div className="sec">{t(lang, 'sec_today')}</div>
            <div className="card">
              <EventList events={todayEvents} emptyMsg={t(lang, 'no_events_today')} />
            </div>
            <div className="sec">{t(lang, 'sec_upcoming')}</div>
            <div className="card">
              <EventList events={upcomingEvents} emptyMsg={t(lang, 'no_events_upcoming')} />
            </div>
          </div>
          <div>
            <div className="sec">Dashboard</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { val: todayEvs.length, lbl: 'eventos hoje' },
                { val: weekEvs.length,  lbl: 'esta semana' },
                { val: freeHrs + 'h',   lbl: 'horas livres' },
                { val: busyHrs + 'h',   lbl: 'em reunião' },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="card" style={{ margin: 0 }}>
                  <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div className="sec">{t(lang, 'sec_pending')}</div>
            <div className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: 5 }} />
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>Enviar relatório mensal</div><div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Prazo: amanhã, 18h</div></div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 5 }} />
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>Renovar assinatura Adobe</div><div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Vence em 3 dias</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && <EventModal onClose={() => setShowModal(false)} onCreated={loadCalendar} />}
    </AppShell>
  )
}
