'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useStore, OWNER_EMAIL } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/lib/types'

interface DbUser {
  id: string; nome: string; email: string; avatar: string
  plano: Plan; criado_em: string; ultimo_login: string; ativo: boolean
}
interface DbLog {
  id: string; acao: string; criado_em: string
  users?: { nome: string; email: string }
}

const PLAN_COLOR: Record<Plan, string> = {
  free: '#55556a', pro: '#a78bfa', business: '#f59e0b',
}
const PLAN_BG: Record<Plan, string> = {
  free: 'rgba(255,255,255,0.05)', pro: 'rgba(124,109,250,0.15)', business: 'rgba(245,158,11,0.15)',
}
const PLAN_LABEL: Record<Plan, string> = {
  free: 'Free', pro: 'Pro ⭐', business: 'Business 🚀',
}

export default function AdminPage() {
  const { userProfile, showToast } = useStore(s => ({ userProfile: s.userProfile, showToast: s.showToast }))
  const router = useRouter()

  const [users,      setUsers]     = useState<DbUser[]>([])
  const [logs,       setLogs]      = useState<DbLog[]>([])
  const [loading,    setLoading]   = useState(true)
  const [search,     setSearch]    = useState('')
  const [filterPlan, setFilter]    = useState<'all' | Plan>('all')
  const [showAdd,    setShowAdd]   = useState(false)
  const [newName,    setNewName]   = useState('')
  const [newEmail,   setNewEmail]  = useState('')
  const [newPlan,    setNewPlan]   = useState<Plan>('free')

  const ownerEmail = userProfile?.email || ''
  const headers = { 'Content-Type': 'application/json', 'x-owner-email': ownerEmail }

  const load = useCallback(async () => {
    if (!ownerEmail || ownerEmail !== OWNER_EMAIL) return
    setLoading(true)
    try {
      const [uRes, lRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/logs',  { headers }),
      ])
      const [uData, lData] = await Promise.all([uRes.json(), lRes.json()])
      setUsers(uData.users || [])
      setLogs(lData.logs || [])
    } catch { showToast('Erro ao carregar dados.') }
    setLoading(false)
  }, [ownerEmail])

  useEffect(() => {
    if (!userProfile) return
    if (userProfile.email !== OWNER_EMAIL) { router.replace('/'); return }
    load()
  }, [userProfile, router, load])

  if (!userProfile || userProfile.email !== OWNER_EMAIL) return null

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchS = !search || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchP = filterPlan === 'all' || u.plano === filterPlan
    return matchS && matchP
  })

  const pro = users.filter(u => u.plano === 'pro').length
  const biz = users.filter(u => u.plano === 'business').length
  const mrr = pro * 29 + biz * 97

  async function changePlan(user: DbUser, plano: Plan) {
    await fetch('/api/admin/users', {
      method: 'PATCH', headers,
      body: JSON.stringify({ userId: user.id, plano, email: user.email, oldPlan: user.plano }),
    })
    showToast(`✅ ${user.nome} → ${PLAN_LABEL[plano]}`)
    load()
  }

  async function removeUser(user: DbUser) {
    if (!confirm(`Remover ${user.nome} (${user.email})?`)) return
    await fetch('/api/admin/users', {
      method: 'DELETE', headers,
      body: JSON.stringify({ userId: user.id, email: user.email }),
    })
    showToast('Usuário removido.')
    load()
  }

  async function addUser() {
    if (!newName || !newEmail) { showToast('Preencha nome e e-mail.'); return }
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers,
      body: JSON.stringify({ nome: newName, email: newEmail, plano: newPlan }),
    })
    if (res.ok) {
      showToast(`✅ ${newName} adicionado!`)
      setNewName(''); setNewEmail(''); setNewPlan('free'); setShowAdd(false)
      load()
    } else { showToast('E-mail já cadastrado.') }
  }

  function exportCSV() {
    const rows = [['Nome','E-mail','Plano','Cadastro'], ...users.map(u => [u.nome, u.email, u.plano, new Date(u.criado_em).toLocaleDateString('pt-BR')])]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    a.download = `nexus_usuarios_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    showToast('✅ CSV exportado!')
  }

  const inp: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(124,109,250,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>Painel Administrativo</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Acesso exclusivo — {OWNER_EMAIL} · <span style={{ color: 'var(--green)' }}>● Supabase conectado</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'rgba(124,109,250,0.15)', color: 'var(--accent2)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>➕ Adicionar</button>
            <button onClick={exportCSV} style={{ background: 'rgba(34,211,160,0.1)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📥 CSV</button>
            <button onClick={load} style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🔄 Atualizar</button>
          </div>
        </div>

        {/* Add User Form */}
        {showAdd && (
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>➕ Adicionar usuário</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px auto', gap: 10, alignItems: 'end' }}>
              <div><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>NOME</div><input style={inp} placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>E-MAIL</div><input style={inp} placeholder="email@exemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>PLANO</div>
                <select style={{ ...inp, cursor: 'pointer' }} value={newPlan} onChange={e => setNewPlan(e.target.value as Plan)}>
                  <option value="free">Free</option><option value="pro">Pro ⭐</option><option value="business">Business 🚀</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addUser} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="sec">Métricas gerais</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { val: users.length, lbl: 'Total usuários',    color: 'var(--text)' },
            { val: pro,          lbl: 'Usuários Pro',      color: 'var(--accent2)' },
            { val: biz,          lbl: 'Usuários Business', color: 'var(--amber)' },
            { val: `R$${mrr.toLocaleString('pt-BR')}`, lbl: 'MRR estimado', color: 'var(--green)' },
          ].map(({ val, lbl, color }) => (
            <div key={lbl} className="card" style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color }}>{loading ? '…' : val}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="sec">Usuários cadastrados</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input style={{ ...inp, flex: 1 }} placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...inp, width: 160, cursor: 'pointer' }} value={filterPlan} onChange={e => setFilter(e.target.value as any)}>
            <option value="all">Todos os planos</option>
            <option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option>
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Carregando...</div>
          ) : !filtered.length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {search || filterPlan !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  {['Usuário','E-mail','Plano','Cadastro','Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: h==='Ações'?'center':'left', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.avatar
                          ? <img src={u.avatar} alt="" style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover',flexShrink:0 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                          : <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'var(--text2)',flexShrink:0 }}>{(u.nome||'?')[0].toUpperCase()}</div>
                        }
                        <div>
                          <div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{u.nome}</div>
                          <div style={{ fontSize:11,color:'var(--text3)' }}>{u.ultimo_login ? `último login ${new Date(u.ultimo_login).toLocaleDateString('pt-BR')}` : 'Nunca logou'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:13,color:'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}>
                      {u.email === OWNER_EMAIL ? (
                        <span style={{ fontSize:11,color:'var(--amber)' }}>👑 Owner</span>
                      ) : (
                        <select value={u.plano} onChange={e=>changePlan(u, e.target.value as Plan)}
                          style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 10px',color:PLAN_COLOR[u.plano],fontSize:12,outline:'none',cursor:'pointer',fontWeight:600 }}>
                          <option value="free">Free</option>
                          <option value="pro">Pro ⭐</option>
                          <option value="business">Business 🚀</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:12,color:'var(--text2)' }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding:'12px 16px',textAlign:'center' }}>
                      {u.email !== OWNER_EMAIL && (
                        <button onClick={()=>removeUser(u)} style={{ background:'rgba(248,113,113,0.1)',color:'var(--red)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:6,padding:'5px 12px',fontSize:11,cursor:'pointer',fontWeight:600 }}>Remover</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Logs */}
        <div className="sec">Log de atividade recente</div>
        <div className="card">
          {loading ? <div style={{ padding:24,textAlign:'center',color:'var(--text3)' }}>Carregando...</div>
          : !logs.length ? <div style={{ textAlign:'center',padding:'24px 16px',color:'var(--text3)' }}>Sem atividade registrada.</div>
          : logs.slice(0,20).map((l,i) => (
            <div key={l.id} style={{ display:'flex',gap:12,alignItems:'flex-start',padding:'8px 0',borderBottom:i<19?'1px solid var(--border)':'none',fontSize:12 }}>
              <span style={{ color:'var(--text3)',flexShrink:0,fontFamily:'monospace',marginTop:1 }}>{new Date(l.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
              <span style={{ color:'var(--text2)' }}>{l.acao}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
