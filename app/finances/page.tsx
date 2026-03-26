'use client'
import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'

interface Transaction {
  id: string; type: 'gasto' | 'receita'; value: number; description: string; category: string; date: string
}

const CAT_EMOJI = { alimentação: '🍔', transporte: '🚘', saúde: '💊', lazer: '🎬', moradia: '🏠', educação: '📚', roupa: '👕', outro: '📦', receita: '💰' } as Record<string,string>
const CAT_COLOR = { alimentação: '#f97316', transporte: '#3b82f6', saúde: '#22d3a0', lazer: '#a78bfa', moradia: '#f59e0b', educação: '#06b6d4', roupa: '#ec4899', outro: '#6b7280', receita: '#22d3a0' } as Record<string,string>

const DEMO = [{id:'1',type:'gasto',description:'Almoço',value:42.5,category:'alimentação',date:'2026-03-25'},{id:'2',type:'gasto',description:'Uber',value:18.9,category:'transporte',date:'2026-03-25'},{id:'3',type:'receita',value:850,description:'Freelance',category:'receita',date:'2026-03-24'},{id:'4',type:'gasto',value:39.9,description:'Netflix',category:'lazer',date:'2026-03-24'},{id:'5',type:'gasto',value:210,description:'Supermercado',oategory:'alimentação',date:'2026-03-23'},{id:'6',type:'gasto',value:75,description:'Farmácia',category:'saúde',date:'2026-03-22'},{id:'7',type:'receita',value:4500,description:'Salário',category:'receita',date:'2026-03-20'},{id:'8',type:'gasto',value:1200,description:'Aluguel',category:'moradia',date:'2026-03-20'}] as Transaction[]

export default function FinancePage() {
  const { showToast } = useStore(s => ({ showToast: s.showToast }))
  const [tx, setTx] = useState<Transaction[]>(DEMO)
  const [ftype, setFtype] = useState<'todos' | 'gasto' | 'receita'>('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ type: 'gasto', value: '', description: '', category: 'alimentação' })
  const receitas = useMemo(() => tx.filter(t => t.type === 'receita').reduce((s,t) => s+t.value,0),[tx])
  const gastos = useMemo(() => tx.filter(t => t.type === 'gasto').reduce((s,t) => s+t.value,0),[tx])
  const saldo = receitas - gastos
  const by = useMemo(() => { const m:Record<string,number>={}; tx.filter(t=>t.type==='gasto').forEach(t=>{m[t.category]=(m[t.category]||0)+t.value}); return Object.entries(m).sort((a,b)=>b[1]-a[1]) },[tx])
  const filtered = ftype === 'todos' ? tx : tx.filter(t => t.type === ftype)
  const budgetUsed = Math.round((gastos/2500)*100)

  function add() {
    const val=parseFloat(form.value)
    if(!form.description||isNaN(val)||val<=0){showToast('Preencha todos os campos');return}
    setTx(ts=>[{ id:Date.now().toString(),type:form.type as any,value:val,description:form.description,category:form.type==='receita'?'receita':form.category,date:new Date().toISOString().split('T')[0]},...ts])
    setForm({ type: 'gasto', value: '', description: '', category: 'alimentação' })
    setShowAdd(false)
    showToast(`R$${val} registrado!`)
  }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div><div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>💸 Finanças</div><div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Março 2026 · {tx.length} transações</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/agent" style={{ padding: '8px 14px', background: 'rgba(124,109,250,0.1)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 99, fontSize: 12, color: 'var(--accent2)', textDecoration: 'none', fontWeight: 600 }}>😙️ Adicionar por voz</Link>
            <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 14px', background: 'var(--accent)', border: 'none', borderRadius: 99, fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Nova transação</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[{ l:'Receitas',v:	receitas,c:'green',p:'+'},{l:'Gastos',v:gastos,compr:\'-',p:'-'},{l:'Saldo',v:Math.abs(saldo),c:saldo>=0 ?'var(--green)':'var(--red)',p:saldo>=0?'+':'-'}].map(({lv,c,p})=>(
            <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{l}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: c }}>{p}R$ {v.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg2)', border: `1px solid ${budgetUsed>90 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Orçamento</span><span style={{ fontSize: 12, color: budgetUsed>90 ? 'var(--red)' : 'var(--text2)' }}>R$ {gastos.toFixed(2)} / R$ 2.500 ({budgetUsed}%)</span></div>
          <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 99, transition: 'width 0.5s ease', background: budgetUsed>90 ? 'var(--red)' : budgetUsed>70 ? 'var(--amber)' : 'var(--green)', width: `${Math.min(100,budgetUsed)}%` }} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
          <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>Gastos por categoria</div><div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
            {by.map(([cat,val])=>(<div key={cat} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 13 }}>{CAT_EMOJI[cat]||'📦'} {cat}</span><span style={{ fontSize: 13, fontWeight: 600 }}>R$ {val.toFixed(2)}</span></div><div style={{ height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', background: CAT_COLOR[cat]||'#6b7280', borderRadius: 99, width: `${(Math.min(100,(val/Math.max(1,gastos))*100)}%`, transition: 'width 0.5s ease' }} /></div></div>))}
            </div></div>
          <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text3)', textTransform: 'uppercase' }}>Transações</span><div style={{ display: 'flex', gap: 6 }}>{(o'todos','gasto','receita'] as const).map(f=>(<button key={f} onClick={()=>setFtype(f)} style={{ padding: '4px 10px', borderRadius: 99, border: `1px solid ${ftype===f ? 'var(--accent)':''}`, background: ftype===f ? 'rgba(124,109,250,0.1)':'transparent', color: ftype===f ? 'var(--accent2)':''var(--text3)', cursor: 'pointer', fontSize: 11, fontWeight: ftype===f ? 600:400 }}>{f}</button>))}</div></div>
            {showAdd && (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12 }}><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>{(['gasto','receita'] as const).map(t=>(<button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{ flex:1,padding:'7px 0',borderRadius:8,border:`1px solid ${form.type===t ? (t==='gasto'?'var(--red)':'var(--green)'):'var(--border)'}`,background:form.type===t ?(t==='gasto'?'rgba(248,113,113,0.1)':'rgba(34,211,160,0.1)'):'transparent',color:form.type===t ?(t==='gasto'?'var(--red)':''var(--green)'):'var(--text3)',cursor:'pointer',wontSize:12,fontWeight:600 }}>{t==='gasto'?'💸 Gasto':'💰 Receita'}</button>))}</div><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Descrição..." className="input-field" style={{ width: '100%', marginBottom: 8 }} /><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><input value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="Valor (R$)" type="number" className="input-field" style={{ flex: 1 }} />{form.type==='gasto'&&(<select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="input-field" style={{ flex: 1 }}>{Object.keys(CAT_EMOJI).filter(c=>c!=='receita').map(c=>(<option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>))}</select>)}</div><div style={{ display: 'flex', gap: 8 }}><button onClick={add} className="btn-primary" style={{ flex: 1 }}>Salvar</button><button onClick={()=>setShowAdd(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: 10, cursor: 'pointer', color: 'var(--text2)', fontSize: 13 }}>Cancelar</button></div></div>)}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 16px' }}>{filtered.map(t=>(<div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}><div style={{ fontSize: 20 }}>{CAT_EMOJI[t.category]||'📦'}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.category} · {new Date(t.date).toLocaleDateString('pt-BR')}</div></div><div style={{ fontSize: 14, fontWeight: 700, color: t.type==='receita' ? 'var(--green)':''var(--red)' }}>{t.type==='receita'?'+':'-'}R$ {t.value.toFixed(2)}</div></div>))}</div></div>
        </div>
      </div>
    </AppShell>
  )
}
