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

  // Dashboard metrics
  const now = new Date()
  const todayStr = now.toDateString()
  const todayEvs = calendarEvents.filter(ev => ev.start.dateTime && new Date(ev.start.dateTime).toDateString() === todayStr)
  const weekEvs  = calendarEvents.filter(ev => { if (!ev.start.dateTime) return false; const d = new Date(ev.start.dateTime); return d >= now && d <= new Date(now.getTime() + 7*24*60*60*1000) })
  let busyMins = 0
  todayEvs.forEach(ev => { if (ev.start.dateTime && ev.end.dateTime) busyMins += (new Date(ev.end.dateTime).getTime() - new Date(ev.start.dateTime).getTime()) / 60000 })
  const busyHrs = Math.round(busyMins / 60 * 10) / 10
  const freeHrs = Math.max(0, Math.round((8 - busyHrs) * 10) / 10)

  const insights = []
  if (todayEvs.length === 0) insights.push({ color: 'var(--green)',   icon: '🎉', text: 'Dia livre de reuniões — ótimo para foco profundo!' })
  if (todayEvs.length >= 5)  insights.push({ color: 'var(--red)',     icon: '🔥', text: `Sobrecarga: ${todayEvs.length} reuniões hoje. Considere reagendar.` })
  if (busyHrs >= 4)          insights.push({ color: 'var(--amber)',   icon: '⏱️', text: `${busyHrs}h em reuniões hoje — reserve intervalos.` })
  if (freeHrs >= 3)          insights.push({ color: 'var(--accent2)', icon: '💡', text: `${freeHrs}h livres disponíveis — ideal para tarefas de alto impacto.` })

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>

        {/* Quick ask bar */}
        <Link href="/agent" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, cursor: 'pointer', textDecoration: 'none', transition: 'border-color 0.2s' }}>
          <span style={{ fontSize: 14, color: 'var(--text3)', flex: 1 }}>{t(lang, 'ask_placeholder')}</span>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </Link>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, background: 'rgba(124,109,250,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--accent2)', textTransform: 'uppercase' }}>Nexus sugere</span>
              <div className="glow-dot animate-pulse-dot" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.slice(0, 2).map((ins, i) => (
                <div key={i} style={{ background: 'var(--bg2)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{ins.icon}</span>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{ins.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="sec">{t(lang, 'sec_quickactions')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '📅', label: t(lang, 'act_newevent'), sub: 'Google Calendar', action: () => setShowModal(true) },
            { icon: '🤖', label: t(lang, 'act_askia'),    sub: 'Gemini Flash',    href: '/agent' },
            { icon: '🔄', label: t(lang, 'act_sync'),     sub: 'Google Calendar', action: loadCalendar },
            { icon: '💬', label: t(lang, 'act_whatsapp'), sub: 'Z-API · WhatsApp', href: '/whatsapp' },
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
          {/* Today + Upcoming */}
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

          {/* Metrics + pending */}
          <div>
            <div className="sec">Dashboard</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { val: todayEvs.length,    lbl: 'eventos hoje' },
                { val: weekEvs.length,     lbl: 'esta semana' },
                { val: freeHrs + 'h',      lbl: 'horas livres hoje' },
                { val: busyHrs + 'h',      lbl: 'horas em reunião' },
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
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Enviar relatório mensal</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Prazo: amanhã, 18h</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Renovar assinatura Adobe</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Vence em 3 dias</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <EventModal onClose={() => setShowModal(false)} onCreated={loadCalendar} />}
    </AppShell>
  )
}
