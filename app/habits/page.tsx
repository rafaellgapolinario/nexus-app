'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'

interface Habit {
  id: string
  name: string
  emoji: string
  frequency: 'diario' | 'semanal'
  streak: number
  best: number
  completedToday: boolean
  completedDays: boolean[] // últimos 7 dias
  category: string
}

const HABIT_EMOJIS = ['🏃', '💪', '🧘', '📚', '💧', '🥗', '😴', '✍️', '🎯', '🎸', '🌿', '💊']

const DEMO_HABITS: Habit[] = [
  { id: '1', name: 'Academia', emoji: '💪', frequency: 'diario', streak: 7, best: 21, completedToday: false, completedDays: [true,true,false,true,true,true,false], category: 'saúde' },
  { id: '2', name: 'Meditar 10 min', emoji: '🧘', frequency: 'diario', streak: 12, best: 30, completedToday: true, completedDays: [true,true,true,true,false,true,true], category: 'mente' },
  { id: '3', name: 'Ler 20 páginas', emoji: '📚', frequency: 'diario', streak: 3, best: 14, completedToday: true, completedDays: [false,false,false,false,true,true,true], category: 'mente' },
  { id: '4', name: 'Beber 2L de água', emoji: '💧', frequency: 'diario', streak: 21, best: 45, completedToday: false, completedDays: [true,true,true,true,true,false,true], category: 'saúde' },
  { id: '5', name: 'Sem redes sociais até 9h', emoji: '📵', frequency: 'diario', streak: 5, best: 8, completedToday: true, completedDays: [false,true,true,false,true,true,true], category: 'foco' },
]

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function HeatDot({ done }: { done: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 4,
      background: done ? 'var(--green)' : 'var(--bg3)',
      border: `1px solid ${done ? 'rgba(34,211,160,0.3)' : 'var(--border)'}`,
      transition: 'all 0.2s',
    }} />
  )
}

function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: (id: string) => void }) {
  const pct = Math.min(100, Math.round((habit.streak / habit.best) * 100))
  const catColor: Record<string, string> = {
    saúde: 'var(--green)', mente: 'var(--accent2)', foco: 'var(--amber)', outro: 'var(--text3)',
  }
  return (
    <div style={{
      background: 'var(--bg2)', border: `1px solid ${habit.completedToday ? 'rgba(34,211,160,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '18px 20px',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg3)', flexShrink: 0,
        }}>
          {habit.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{habit.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              color: catColor[habit.category] || 'var(--text3)',
              background: `${catColor[habit.category] || 'var(--text3)'}15`,
              border: `1px solid ${catColor[habit.category] || 'var(--text3)'}25`,
              borderRadius: 99, padding: '1px 7px',
            }}>
              {habit.category}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{habit.frequency}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(habit.id)}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: habit.completedToday ? 'var(--green)' : 'var(--bg3)',
            cursor: 'pointer', fontSize: 16, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {habit.completedToday ? '✓' : '○'}
        </button>
      </div>

      {/* Últimos 7 dias */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {DAYS.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{d}</div>
            <HeatDot done={habit.completedDays[i]} />
          </div>
        ))}
      </div>

      {/* Streak + progresso */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700 }}>🔥 {habit.streak} dias</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Recorde: {habit.best}d</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'var(--green)', borderRadius: 99,
          width: `${pct}%`, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

export default function HabitsPage() {
  const { showToast } = useStore(s => ({ showToast: s.showToast }))
  const [habits, setHabits] = useState<Habit[]>(DEMO_HABITS)
  const [filter, setFilter] = useState<'todos' | 'saúde' | 'mente' | 'foco'>('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎯')
  const [newCat, setNewCat] = useState('saúde')

  const doneTodayCount = habits.filter(h => h.completedToday).length
  const totalStreak = habits.reduce((s, h) => s + h.streak, 0)
  const filtered = filter === 'todos' ? habits : habits.filter(h => h.category === filter)

  function toggleHabit(id: string) {
    setHabits(hs => hs.map(h => h.id === id
      ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) }
      : h
    ))
  }

  function addHabit() {
    if (!newName.trim()) return
    const h: Habit = {
      id: Date.now().toString(), name: newName, emoji: newEmoji,
      frequency: 'diario', streak: 0, best: 0, completedToday: false,
      completedDays: [false, false, false, false, false, false, false], category: newCat,
    }
    setHabits(hs => [h, ...hs])
    setNewName(''); setShowAdd(false)
    showToast(`🎯 Hábito "${newName}" criado!`)
  }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>🎯 Hábitos</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {doneTodayCount}/{habits.length} concluídos hoje · {totalStreak} dias de streak total
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/agent" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(124,109,250,0.1)', border: '1px solid rgba(124,109,250,0.3)',
              borderRadius: 99, fontSize: 12, color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600,
            }}>
              🎙️ Criar por voz
            </Link>
            <button onClick={() => setShowAdd(!showAdd)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 99, fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>
              + Novo hábito
            </button>
          </div>
        </div>

        {/* Progresso do dia */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(34,211,160,0.1),rgba(34,211,160,0.04))',
          border: '1px solid rgba(34,211,160,0.2)', borderRadius: 'var(--radius)',
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Progresso hoje — {Math.round((doneTodayCount / habits.length) * 100)}%
            </div>
            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg,var(--green),#4ade80)',
                borderRadius: 99, width: `${(doneTodayCount / habits.length) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>
              {doneTodayCount}/{habits.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>hábitos</div>
          </div>
        </div>

        {/* Form novo hábito */}
        {showAdd && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: 20, marginBottom: 20,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Novo hábito</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {HABIT_EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewEmoji(e)} style={{
                    width: 34, height: 34, borderRadius: 8, border: `2px solid ${newEmoji === e ? 'var(--accent)' : 'var(--border)'}`,
                    background: newEmoji === e ? 'rgba(124,109,250,0.1)' : 'var(--bg3)',
                    cursor: 'pointer', fontSize: 16,
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="Nome do hábito..."
              className="input-field"
              style={{ width: '100%', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {['saúde', 'mente', 'foco', 'outro'].map(c => (
                <button key={c} onClick={() => setNewCat(c)} style={{
                  padding: '6px 12px', borderRadius: 99, border: `1px solid ${newCat === c ? 'var(--accent)' : 'var(--border)'}`,
                  background: newCat === c ? 'rgba(124,109,250,0.1)' : 'transparent',
                  color: newCat === c ? 'var(--accent2)' : 'var(--text3)',
                  cursor: 'pointer', fontSize: 12,
                }}>{c}</button>
              ))}
              <button onClick={addHabit} className="btn-primary" style={{ marginLeft: 'auto', padding: '6px 18px' }}>
                Criar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['todos', 'saúde', 'mente', 'foco'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 99, border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === f ? 'rgba(124,109,250,0.1)' : 'transparent',
              color: filter === f ? 'var(--accent2)' : 'var(--text2)',
              cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 600 : 400,
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid de hábitos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map(h => <HabitCard key={h.id} habit={h} onToggle={toggleHabit} />)}
        </div>
      </div>
    </AppShell>
  )
}
