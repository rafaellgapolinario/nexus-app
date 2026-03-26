'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { EventModal } from '@/components/EventModal'
import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

// ── Mini componentes ──────────────────────────────────────────────────────────
function StatCard({ val, label, color = 'var(--accent2)', sub }: { val: string | number; label: string; color?: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 20px',
    }}>
      <div style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
      color: 'var(--text3)', textTransform: 'uppercase', margin: '20px 0 10px',
    }}>
      {children}
    </div>
  )
}

function HabitRow({ name, done, streak }: { name: string; done: boolean; streak: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: done ? 'var(--green)' : 'transparent',
        border: done ? 'none' : '2px solid var(--border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, cursor: 'pointer',
      }}>
        {done ? '✓' : ''}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: done ? 'var(--text2)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
        {name}
      </div>
      <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>🔥 {streak}d</div>
    </div>
  )
}

function TaskRow({ title, priority, due }: { title: string; priority: 'alta' | 'media' | 'baixa'; due?: string }) {
  const colors = { alta: 'var(--red)', media: 'var(--amber)', baixa: 'var(--green)' }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: colors[priority], flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        {due && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{due}</div>}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        color: colors[priority], background: `${colors[priority]}18`,
        border: `1px solid ${colors[priority]}30`,
        borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase',
      }}>
        {priority}
      </div>
    </div>
  )
}

function FinanceRow({ desc, value, type, category }: { desc: string; value: number; type: 'gasto' | 'receita'; category: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 20 }}>
        {{ alimentação: '🍔', transporte: '🚗', saúde: '💊', lazer: '🎬', outro: '📦', receita: '💰' }[category] || '💸'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{desc}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{category}</div>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 700,
        color: type === 'receita' ? 'var(--green)' : 'var(--red)',
      }}>
        {type === 'receita' ? '+' : '-'}R$ {value.toFixed(2)}
      </div>
    </div>
  )
}

// ── Dados demo (seriam vindos do store/supabase) ───────────────────────────────
const DEMO_HABITS = [
  { name: 'Meditar 10 min', done: true, streak: 12 },
  { name: 'Academia', done: false, streak: 7 },
  { name: 'Ler 20 páginas', done: true, streak: 3 },
  { name: 'Beber 2L de água', done: false, streak: 21 },
]
const DEMO_TASKS = [
  { title: 'Enviar proposta ao cliente', priority: 'alta' as const, due: 'Hoje, 18h' },
  { title: 'Revisar relatório mensal', priority: 'alta' as const, due: 'Amanhã, 12h' },
  { title: 'Atualizar LinkedIn', priority: 'media' as const, due: 'Esta semana' },
  { title: 'Comprar presente aniversário', priority: 'baixa' as const, due: 'Em 5 dias' },
]
const DEMO_FINANCES = [
  { desc: 'Almoço', value: 42.5, type: 'gasto' as const, category: 'alimentação' },
  { desc: 'Uber', value: 18.9, type: 'gasto' as const, category: 'transporte' },
  { desc: 'Freelance design', value: 850, type: 'receita' as const, category: 'receita' },
  { desc: 'Netflix', value: 39.9, type: 'gasto' as const, category: 'lazer' },
]

// ── Página principal ──────────────────────────────────────────────────────────
export default function HomePage() {
  const { lang, accessToken, userProfile, calendarEvents, setCalendarEvents, showToast } = useStore(s => ({
    lang: s.lang, accessToken: s.accessToken, userProfile: s.userProfile,
    calendarEvents: s.calendarEvents, setCalendarEvents: s.setCalendarEvents, showToast: s.showToast,
  }))
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loadingCal, setLoadingCal] = useState(false)
  const [showModal, setShowModal] = useState(false)

  async function loadCalendar() {
    if (!accessToken) return
    setLoadingCal(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/calendar?type=today', { headers: { Authorization: `Bearer ${accessToken}` } }),
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
  const todayEvs = calendarEvents.filter(ev
    => ev.start.dateTime && new Date(ev.start.dateTime).toDateString() === todayStr)
  const weekEvs = calendarEvents.filter(ev => {
    if (!ev.start.dateTime) return false
    const d = new Date(ev.start.dateTime)
    return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  })
  const habitsToday = DEMO_HABITS.filter(h => h.done).length
  const totalReceitas = DEMO_FINANCES.filter(f => f.type === 'receita').reduce((s, f) => s + f.value, 0)
  const totalGastos = DEMO_FINANCES.filter(f => f.type === 'gasto').reduce((s, f) => s + f.value, 0)
  const hora = now.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>
            {saudacao}, {userProfile?.given_name || 'usuário'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {todayEvs.length > 0 ? ` · ${todayEvs.length} evento${todayEvs.length > 1 ? 's' : ''} hoje` : ' · Agenda livre hoje'}
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
          <StatCard val={todayEvs.length} label="eventos hoje" color="var(--accent2)" sub={`${weekEvs.length} esta semana`} />
          <StatCard val={`${habitsToday}/${DEMO_HABITS.length}`} label="hábitos hoje" color="var(--green)" sub="streak médio: 11d" />
          <StatCard val={`R$${totalGastos.toFixed(0)}`} label="gastos hoje" color="var(--red)" sub={`receitas: R$${totalReceitas.toFixed(0)}`} />
          <StatCard val={DEMO_TASKS.filter(t => t.priority === 'alta').length} label="tarefas urgentes" color="var(--amber)" sub={`${DEMO_TASKS.length} total`} />
        </div>
        <SectionTitle>Ações rápidas</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { icon: '📅', label: 'Novo evento', sub: 'Google Calendar', action: () => setShowModal(true) },
            { icon: loadingCal ? '⏳' : '🔄', label: 'Sincronizar', sub: 'Atualizar agenda', action: loadCalendar },
            { icon: '💬', label: 'WhatsApp', sub: 'Z-API · Mensagens', href: '/whatsapp' },
            { icon: '⚙️', label: 'Automações', sub: 'Se X → Faça Y', href: '/automations' },
          ].map(({ icon, label, sub, action, href }) => {
            const style: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none' }
            return href ? (<Link href={href} key={label} style={style}><div style={{ fontSize: 22 }}>{icon}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div></Link>) : (<div key={label} onClick={action} style={style}><div style={{ fontSize: 22 }}>{icon}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div></div>)
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div><SectionTitle>📝 Tarefas prioritárias</SectionTitle><div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px 4px' }}>{DEMO_TASKS.map((task, i) => <TaskRow key={i} {...task} />)}<Link href="/agent" style={{ display: 'block', textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--accent2)', textDecoration: 'none' }}>+ Nova tarefa via IA</Link></div></div>
          <div><SectionTitle>🎯 Hábitos de hoje</SectionTitle><div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px 4px' }}>{DEMO_HABITS.map((h, i) => <HabitRow key={i} {...h} />)}<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', fontSize: 12, color: 'var(--text3)' }}><span>{habitsToday}/{DEMO_HABITS.length} concluídos</span><div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, flex: 1, margin: '0 10px', overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--green)', borderRadius: 99, width: `${(habitsToday / DEMO_HABITS.length) * 100}%`, transition: 'width 0.5s ease' }} /></div><span style={{ color: 'var(--green)', fontWeight: 600 }}>{Math.round((habitsToday / DEMO_HABITS.length) * 100)}%</span></div></div></div>
          <div><SectionTitle>💸 Últimas transações</SectionTitle><div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px 4px', marginBottom: 16 }}>{DEMO_FINANCES.map((f, i) => <FinanceRow key={i} {...f} />)}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', fontSize: 12 }}><span style={{ color: 'var(--green)' }}>+R$ {totalReceitas.toFixed(2)}</span><span style={{ color: 'var(--text3)' }}>Saldo do dia</span><span style={{ color: totalReceitas - totalGastos >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{`${totalReceitas - totalGastos >= 0 ? '+' : ''}R$ ${(totalReceitas - totalGastos).toFixed(2)}`}</span></div></div><SectionTitle>📅 Próximos eventos</SectionTitle><div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px' }}>{upcomingEvents.slice(0, 3).length > 0 ? upcomingEvents.slice(0, 3).map((ev, i) => (<div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}><div style={{ fontSize: 13, fontWeight: 500 }}>{ev.summary}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ev.start.date}</div></div>)) : (<div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>{accessToken ? 'Nenhum evento próximo' : 'Faça login para ver sua agenda'}</div>)}</div></div>
        </div>
      </div>
      {showModal && <EventModal onClose={() => setShowModal(false)} onCreated={loadCalendar} />}
    </AppShell>
  )
}
