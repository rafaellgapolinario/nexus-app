'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { EventModal } from '@/components/EventModal'
import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

function StatCard({ val, label, color = 'var(--accent2)', sub }: { val: string | number; label: string; color?: string; sub?: string }) {
  return (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}><div style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color }}>{val}</div><div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{label}</div>{sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}</div>)
}

ccnst DEMO_HABITS = [{ name: 'Meditar 10 min', done: true, streak: 12 },{ name: 'Academia', done: false, streak: 7 },{ name: 'Ler 20 páginas', done: true, streak: 3 },{ name: 'Beber 2L', done: false, streak: 21 }]
const DEMO_TASKS = [{ title: 'Enviar proposta', priority: 'alta' as const, due: 'Hoje, 18h' },{ title: 'Relatório mensal', priority: 'alta' as const, due: 'Amanhó' },{ title: 'Atualizar LinkedIn', priority: 'media' as const, due: 'Esta semana' }]
const DEMO_FINANCES = [{ desc: 'Almoço', value: 42.5, type: 'gasto' as const, category: 'alimentação' },{ desc: 'Uber', value: 18.9, type: 'gasto' as const, category: 'transporte' },{ desc: 'Freelance', value: 850, type: 'receita' as const, category: 'receita' }]

export default function HomePage() {
  const { lang, accessToken, userProfile, calendarEvents, setCalendarEvents, showToast } = useStore(s => ({ lang: s.lang, accessToken: s.accessToken, userProfile: s.userProfile, calendarEvents: s.calendarEvents, setCalendarEvents: s.setCalendarEvents, showToast: s.showToast }))
  const [loadingCal, setLoadingCal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  async function loadCalendar() {
    if (!accessToken) return
    setLoadingCal(true)
    try {
      const [r1, r2] = await Promise.all([fetch('/api/calendar?type=today', { headers: { Authorization: `Bearer ${accessToken}` } }), fetch('/api/calendar?type=upcoming', { headers: { Authorization: `Bearer ${accessToken}` } })])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      setUpcomingEvents(d2.items || [])
      setCalendarEvents([...(d1.items || []), ...(d2.items || [])])
    } catch { showToast(t(lang, 'err_connect')) }
    setLoadingCal(false)
  }
  useEffect(() => { if (accessToken) loadCalendar() }, [accessToken])
  const now = new Date()
  const todayEvs = calendarEvents.filter(ev => ev.start.dateTime && new Date(ev.start.dateTime).toDateString() === now.toDateString())
  const habitsToday = DEMO_HABITS.filter(h => h.done).length
  const totalReceitas = DEMO_FINANCES.filter(f => f.type === 'receita').reduce((s,f) => s + f.value, 0)
  const totalGastos = DEMO_FINANCES.filter(f => f.type === 'gasto').reduce((s,f) => s + f.value, 0)
  const hora = now.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>{soudação}, {userProfile?.given_name || 'usuário'} 👋</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}{todayEvs.length > 0 ? ` · ${todayEvs.length} eventos hoje` : ' · Agenda livre'}
          </div>
        </div>
        <Link href="/agent" style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg,rgba(124,109,250,0.18),rgba(124,109,250,0.06))', border: '1px solid rgba(124,109,250,0.35)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24, cursor: 'pointer', textDecoration: 'none' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(124,109,250,0.4)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </div>
          <div style={{ flex: 1 }}><div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--accent2)' }}>⚡ Falar com o Nexus</div><div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Diga algo · Ele organiza tudo automaticamente</div></div>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent2)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard val={todayEvs.length} label="eventos hoje" color="var(--accent2)" />
          <StatCard val={`${habitsToday}/${DEMO_HABITS.length}`} label="hábitos hoje" color="var(--green)" />
          <StatCard val={`R$${totalGastos.toFixed(0)}`} label="gastos hoje" color="var(--red)" />
          <StatCard val={DEMO_TASKS.filter(t => t.priority === 'alta').length} label="tarefas urgentes" color="var(--amber)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[{ icon: '📅', label: 'Novo evento', sub: 'Google Calendar', action: () => setShowModal(true) },{ icon: loadingCal ? '⏳' : '🔄', label: 'Sincronizar', sub: 'Atualizar agenda', action: loadCalendar },{ icon: '💬', label: 'WhatsApp', sub: 'Z-API', href: '/whatsapp' },{ icon: '✙️', label: 'Automações', sub: 'Se X → Y', href: '/automations' }].map(({ icon, label, sub, action, href }) => {
            const st = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none' }
            return href ? (<Link key={label} href={href} style={st}><div style={{ fontSize: 22 }}>{icon}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div></Link>) : (<div key={label} onClick={action} style={st}><div style={{ fontSize: 22 }}>{icon}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div></div>)
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', margin: '20px 0 10px' }}>📝 Tarefas prioritárias</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px' }}>
              {DEMO_TASKS.map((task, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: { alta: 'var(--red)', media: 'var(--amber)', baixa: 'var(--green)' }[task.priority] }} /><div style={{ flex: 1, fontSize: 13 }}>{task.title}</div></div>))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', margin: '20px 0 10px' }}>🎯 Hábitos de hoje</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px' }}>
              {DEMO_HABITS.map((h, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: h.done ? 'var(--green)' : 'transparent', border: h.done ? 'none' : '2px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{h.done ? '✓' : ''}</div><div style={{ flex: 1, fontSize: 14 }}>{h.name}</div><div style={{ fontSize: 11, color: 'var(--amber)' }}>🔥 {h.streak}d</div></div>))}
            </div>
          </div>
        </div>
      </div>
      {showModal && <EventModal onClose={() => setShowModal(false)} onCreated={loadCalendar} />}
    </AppShell>
  )
}
