'use client'
import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'gasto' | 'receita'
  value: number
  description: string
  category: string
  date: string
}

const CAT_EMOJI: Record<string, string> = {
  alimentação: '🍔', transporte: '🚗', saúde: '💊', lazer: '🎬',
  moradia: '🏠', educação: '📚', roupa: '👕', outro: '📦', receita: '💰',
}
const CAT_COLOR: Record<string, string> = {
  alimentação: '#f97316', transporte: '#3b82f6', saúde: '#22d3a0',
  lazer: '#a78bfa', moradia: '#f59e0b', educação: '#06b6d4',
  roupa: '#ec4899', outro: '#6b7280', receita: '#22d3a0',
}

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'gasto', value: 42.5, description: 'Almoço restaurante', category: 'alimentação', date: '2026-03-25' },
  { id: '2', type: 'gasto', value: 18.9, description: 'Uber', category: 'transporte', date: '2026-03-25' },
  { id: '3', type: 'receita', value: 850, description: 'Freelance design', category: 'receita', date: '2026-03-24' },
  { id: '4', type: 'gasto', value: 39.9, description: 'Netflix', category: 'lazer', date: '2026-03-24' },
  { id: '5', type: 'gasto', value: 210, description: 'Supermercado', category: 'alimentação', date: '2026-03-23' },
  { id: '6', type: 'gasto', value: 75, description: 'Farmácia', category: 'saúde', date: '2026-03-22' },
  { id: '7', type: 'receita', value: 4500, description: 'Salário', category: 'receita', date: '2026-03-20' },
  { id: '8', type: 'gasto', value: 1200, description: 'Aluguel', category: 'moradia', date: '2026-03-20' },
  { id: '9', type: 'gasto', value: 89, description: 'Curso online', category: 'educação', date: '2026-03-18' },
  { id: '10', type: 'gasto', value: 33.5, description: 'iFood', category: 'alimentação', date: '2026-03-17' },
]

const BUDGET_LIMIT = 2500

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', background: color, borderRadius: 99, width: `${Math.min(100, pct)}%`, transition: 'width 0.5s ease' }} />
    </div>
  )
}

export default function FinancePage() {
  const { showToast } = useStore(s => ({ showToast: s.showToast }))
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS)
  const [filterType, setFilterType] = useState<'todos' | 'gasto' | 'receita'>('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ type: 'gasto', value: '', description: '', category: 'alimentação' })

  const totalReceitas = useMemo(() => transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0), [transactions])
  const totalGastos = useMemo(() => transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.value, 0), [transactions])
  const saldo = totalReceitas - totalGastos

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.filter(t => t.type === 'gasto').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.value
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [transactions])

  const filtered = filterType === 'todos' ? transactions : transactions.filter(t => t.type === filterType)

  function addTransaction() {
    const val = parseFloat(form.value)
    if (!form.description || isNaN(val) || val <= 0) { showToast('Preencha todos os campos'); return }
    const t: Transaction = {
      id: Date.now().toString(), type: form.type as any, value: val,
      description: form.description, category: form.type === 'receita' ? 'receita' : form.category,
      date: new Date().toISOString().split('T')[0],
    }
    setTransactions(ts => [t, ...ts])
    setForm({ type: 'gasto', value: '', description: '', category: 'alimentação' })
    setShowAdd(false)
    showToast(`${form.type === 'receita' ? '💰 Receita' : '💸 Gasto'} de R$${val} registrado!`)
  }

  const budgetUsed = Math.round((totalGastos / BUDGET_LIMIT) * 100)

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>💸 Finanças</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Março 2026 · {transactions.length} transações</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/agent" style={{ padding: '8px 14px', background: 'rgba(124,109,250,0.1)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 99, fontSize: 12, color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>🙙️ Adicionar por voz</Link>
            <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 14px', background: 'var(--accent)', border: 'none', borderRadius: 99, fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Nova transação</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[{ label: 'Receitas', value: totalReceitas, color: 'var(--green)', prefix: '+' },{ label: 'Gastos', value: totalGastos, color: 'var(--red)', prefix: '-' },{ label: 'Saldo', value: Math.abs(saldo), color: saldo >= 0 ? 'var(--green)' : 'var(--red)', prefix: saldo >= 0 ? '+' : '-' }].map(({ label, value, color, prefix }) => (
            <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color }}>{prefix}R$ {value.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg2)', border: `1px solid ${budgetUsed > 90 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>🎯 Orçamento mensal</span>
            <span style={{ fontSize: 12, color: budgetUsed > 90 ? 'var(--red)' : 'var(--text2)' }}>R$ {totalGastos.toFixed(2)} / R$ {BUDGET_LIMIT.toLocaleString('pt-BR')} ({budgetUsed}%)</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.5s ease', background: budgetUsed > 90 ? 'var(--red)' : budgetUsed > 70 ? 'var(--amber)' : 'var(--green)', width: `${Math.min(100, budgetUsed)}%` }} />
          </div>
          {budgetUsed > 90 && (<div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>⚠️ Você atingiu {budgetUsed}% do orçamento mensal!</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>Gastos por categoria</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
              {byCategory.map(([cat, val]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{CAT_EMOJI[cat] || '📦'} {cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>R$ {val.toFixed(2)}</span>
                  </div>
                  <Bar pct={(val / totalGastos) * 100} color={CAT_COLOR[cat] || '#6b7280'} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text3)', textTransform: 'uppercase' }}>Transações</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['todos', 'gasto', 'receita'] as const).map(f => (
                  <button key={f} onClick={() => setFilterType(f)} style={{ padding: '4px 10px', borderRadius: 99, border: `1px solid ${filterType === f ? 'var(--accent)' : 'var(--border)'}`, background: filterType === f ? 'rgba(124,109,250,0.1)' : 'transparent', color: filterType === f ? 'var(--accent2)' : 'var(--text3)', cursor: 'pointer', fontSize: 11, fontWeight: filterType === f ? 600 : 400 }}>{f}</button>
                ))}
              </div>
            </div>
            {showAdd && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {(['gasto', 'receita'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${form.type === t ? (t === 'gasto' ? 'var(--red)' : 'var(--green)') : 'var(--border)'}`, background: form.type === t ? (t === 'gasto' ? 'rgba(248,113,113,0.1)' : 'rgba(34,211,160,0.1)') : 'transparent', color: form.type === t ? (t === 'gasto' ? 'var(--red)' : 'var(--green)') : 'var(--text3)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t === 'gasto' ? '💸 Gasto' : '💰 Receita'}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição..." className="input-field" style={{ width: '100%', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Valor (R$)" type="number" className="input-field" style={{ flex: 1 }} />
                  {form.type === 'gasto' && (
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field" style={{ flex: 1 }}>
                      {Object.keys(CAT_EMOJI).filter(c => c !== 'receita').map(c => (
                        <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addTransaction} className="btn-primary" style={{ flex: 1 }}>Salvar</button>
                  <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: 10, cursor: 'pointer', color: 'var(--text2)', fontSize: 13 }}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px' }}>
              {filtered.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 20 }}>{CAT_EMOJI[t.category] || '📦'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.category} · {new Date(t.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'receita' ? 'var(--green)' : 'var(--red)' }}>{t.type === 'receita' ? '+' : '-'}R$ {t.value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
