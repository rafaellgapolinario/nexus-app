'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useStore, OWNER_EMAIL } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import { useRouter } from 'next/navigation'
import type { RegisteredUser, Plan } from '@/lib/types'

const USERS_KEY = 'nexus_registered_users'
const LOGS_KEY  = 'nexus_admin_logs'

function getUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
}
function saveUsers(users: RegisteredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
function addLog(msg: string) {
  const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]')
  logs.unshift({ time: new Date().toISOString(), msg })
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)))
}
function getLogs(): { time: string; msg: string }[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]')
}

const PLAN_STYLE: Record<Plan, React.CSSProperties> = {
  free:     { color: '#55556a', background: 'rgba(255,255,255,0.05)' },
  pro:      { color: '#a78bfa', background: 'rgba(124,109,250,0.15)' },
  business: { color: '#f59e0b', background: 'rgba(245,158,11,0.15)' },
}
const PLAN_LABEL: Record<Plan, string> = {
  free: 'Free', pro: 'Pro ⭐', business: 'Business 🚀',
}

export default function AdminPage() {
  const { userProfile, showToast } = useStore(s => ({ userProfile: s.userProfile, showToast: s.showToast }))
  const router = useRouter()

  const [users,       setUsersState] = useState<RegisteredUser[]>([])
  const [logs,        setLogs]       = useState<{ time: string; msg: string }[]>([])
  const [search,      setSearch]     = useState('')
  const [filterPlan,  setFilterPlan] = useState<'all' | Plan>('all')
  const [showAdd,     setShowAdd]    = useState(false)
  // Add user form
  const [newName,     setNewName]    = useState('')
  const [newEmail,    setNewEmail]   = useState('')
  const [newPlan,     setNewPlan]    = useState<Plan>('free')

  const refresh = useCallback(() => {
    setUsersState(getUsers())
    setLogs(getLogs().slice(0, 20))
  }, [])

  useEffect(() => {
    if (userProfile && userProfile.email !== OWNER_EMAIL) router.replace('/')
    else refresh()
  }, [userProfile, router, refresh])

  if (!userProfile || userProfile.email !== OWNER_EMAIL) return null

  // Filtered users
  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchPlan   = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  const pro = users.filter(u => u.plan === 'pro').length
  const biz = users.filter(u => u.plan === 'business').length
  const mrr = pro * 29 + biz * 97

  function changePlan(index: number, plan: Plan) {
    const all = getUsers()
    const realIndex = users.indexOf(filtered[index])
    const old = all[realIndex]?.plan
    if (!all[realIndex]) return
    all[realIndex].plan = plan
    saveUsers(all)
    addLog(`Plano de ${all[realIndex].email} alterado: ${old} → ${plan}`)
    refresh()
    showToast(`✅ Plano de ${all[realIndex].name} → ${PLAN_LABEL[plan]}`)
  }

  function deleteUser(index: number) {
    const all = getUsers()
    const realIndex = users.indexOf(filtered[index])
    if (!all[realIndex]) return
    if (!confirm(`Remover ${all[realIndex].name} (${all[realIndex].email})?`)) return
    addLog(`Usuário removido: ${all[realIndex].email}`)
    all.splice(realIndex, 1)
    saveUsers(all)
    refresh()
    showToast('Usuário removido.')
  }

  function addUserManually() {
    if (!newName || !newEmail) { showToast('Preencha nome e e-mail.'); return }
    const all = getUsers()
    if (all.find(u => u.email === newEmail)) { showToast('E-mail já cadastrado.'); return }
    all.push({
      id: Date.now(), name: newName, email: newEmail,
      picture: '', plan: newPlan,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      logins: 0,
    })
    saveUsers(all)
    addLog(`Usuário adicionado manualmente: ${newEmail} (${newPlan})`)
    refresh()
    setNewName(''); setNewEmail(''); setNewPlan('free'); setShowAdd(false)
    showToast(`✅ ${newName} adicionado como ${PLAN_LABEL[newPlan]}!`)
  }

  function exportCSV() {
    const rows = [
      ['Nome', 'E-mail', 'Plano', 'Cadastro', 'Logins'],
      ...users.map(u => [
        u.name, u.email, u.plan,
        new Date(u.joinedAt).toLocaleDateString('pt-BR'),
        String(u.logins || 0),
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `nexus_usuarios_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    showToast('✅ CSV exportado!')
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(124,109,250,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>Painel Administrativo</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Acesso exclusivo — {OWNER_EMAIL}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'rgba(124,109,250,0.15)', color: 'var(--accent2)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ➕ Adicionar usuário
            </button>
            <button onClick={exportCSV} style={{ background: 'rgba(34,211,160,0.1)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              📥 Exportar CSV
            </button>
            <button onClick={refresh} style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* ── Add User Form ── */}
        {showAdd && (
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(124,109,250,0.3)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>➕ Adicionar usuário manualmente</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>NOME</div>
                <input style={inputStyle} placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>E-MAIL</div>
                <input style={inputStyle} placeholder="email@exemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>PLANO</div>
                <select style={selectStyle} value={newPlan} onChange={e => setNewPlan(e.target.value as Plan)}>
                  <option value="free">Free</option>
                  <option value="pro">Pro ⭐</option>
                  <option value="business">Business 🚀</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addUserManually} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Salvar
                </button>
                <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Metrics ── */}
        <div className="sec">Métricas gerais</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { val: users.length, lbl: 'Total usuários',    color: 'var(--text)' },
            { val: pro,          lbl: 'Usuários Pro',      color: 'var(--accent2)' },
            { val: biz,          lbl: 'Usuários Business', color: 'var(--amber)' },
            { val: `R$${mrr.toLocaleString('pt-BR')}`, lbl: 'MRR estimado', color: 'var(--green)' },
          ].map(({ val, lbl, color }) => (
            <div key={lbl} className="card" style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div className="sec">Usuários cadastrados</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={{ ...selectStyle, width: 160 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value as any)}>
            <option value="all">Todos os planos</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
        </div>

        {/* ── Users Table ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {!filtered.length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {search || filterPlan !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  {['Usuário', 'E-mail', 'Plano', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Ações' ? 'center' : 'left', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.picture
                          ? <img src={u.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>{(u.name || '?')[0].toUpperCase()}</div>
                        }
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.logins || 0} login(s)</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.email === OWNER_EMAIL ? (
                        <span style={{ fontSize: 11, color: 'var(--amber)' }}>👑 Owner</span>
                      ) : (
                        <select
                          value={u.plan}
                          onChange={e => changePlan(i, e.target.value as Plan)}
                          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: PLAN_STYLE[u.plan].color as string, fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro ⭐</option>
                          <option value="business">Business 🚀</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>
                      {new Date(u.joinedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {u.email !== OWNER_EMAIL && (
                        <button
                          onClick={() => deleteUser(i)}
                          style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Activity Log ── */}
        <div className="sec">Log de atividade recente</div>
        <div className="card">
          {!logs.length ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text3)' }}>Sem atividade registrada.</div>
          ) : logs.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
              <span style={{ color: 'var(--text3)', flexShrink: 0, fontFamily: 'monospace' }}>
                {new Date(l.time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ color: 'var(--text2)' }}>{l.msg}</span>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
