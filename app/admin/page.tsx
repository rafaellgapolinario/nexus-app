'use client'
import React, { useEffect } from 'react'
import { useStore, OWNER_EMAIL } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import { useRouter } from 'next/navigation'
import type { RegisteredUser } from '@/lib/types'

const USERS_KEY = 'nexus_registered_users'
const LOGS_KEY  = 'nexus_admin_logs'

function getUsers(): RegisteredUser[] { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') }
function getLogs(): { time: string; msg: string }[] { return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]') }

export default function AdminPage() {
  const { userProfile } = useStore(s => ({ userProfile: s.userProfile }))
  const router = useRouter()

  useEffect(() => {
    if (userProfile && userProfile.email !== OWNER_EMAIL) router.replace('/')
  }, [userProfile])

  if (!userProfile || userProfile.email !== OWNER_EMAIL) return null

  const users = getUsers()
  const pro = users.filter(u => u.plan === 'pro').length
  const biz = users.filter(u => u.plan === 'business').length
  const mrr = pro * 29 + biz * 97
  const logs = getLogs().slice(0, 20)

  const PLAN_STYLE: Record<string, React.CSSProperties> = {
    free:     { color: 'var(--text3)',   background: 'rgba(255,255,255,0.05)' },
    pro:      { color: 'var(--accent2)', background: 'rgba(124,109,250,0.15)' },
    business: { color: 'var(--amber)',   background: 'rgba(245,158,11,0.15)' },
  }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(124,109,250,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>Painel Administrativo</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Acesso exclusivo — {OWNER_EMAIL}</div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="sec">Métricas gerais</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { id: 'total', val: users.length, lbl: 'Total usuários', color: 'var(--text)' },
            { id: 'pro',   val: pro,          lbl: 'Usuários Pro',   color: 'var(--accent2)' },
            { id: 'biz',   val: biz,          lbl: 'Usuários Business', color: 'var(--amber)' },
            { id: 'mrr',   val: `R$${mrr.toLocaleString('pt-BR')}`, lbl: 'MRR estimado', color: 'var(--green)' },
          ].map(({ id, val, lbl, color }) => (
            <div key={id} className="card" style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="sec">Usuários cadastrados</div>
        {!users.length ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Nenhum usuário cadastrado ainda.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  {['Usuário','E-mail','Plano','Cadastro'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.picture ? <img src={u.picture} style={{ width: 32, height: 32, borderRadius: '50%' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{(u.name||'?')[0].toUpperCase()}</div>}
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, ...(PLAN_STYLE[u.plan] || PLAN_STYLE.free) }}>
                        {u.plan === 'pro' ? 'Pro ⭐' : u.plan === 'business' ? 'Business 🚀' : 'Free'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{new Date(u.joinedAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Logs */}
        <div className="sec">Log de atividade recente</div>
        <div className="card">
          {!logs.length ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text3)' }}>Sem atividade registrada.</div>
          ) : logs.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
              <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{new Date(l.time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: 'var(--text2)' }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
