'use client'
import { useState } from 'react'
import { useStore, getPlanAccess } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { PlanGateModal } from '@/components/PlanGateModal'

export default function WhatsAppPage() {
  const { lang, waUsers, addWaUser, removeWaUser, zapiInstance, zapiToken, zapiClientToken, currentPlan, userProfile, showToast } = useStore(s => ({
    lang: s.lang, waUsers: s.waUsers, addWaUser: s.addWaUser, removeWaUser: s.removeWaUser,
    zapiInstance: s.zapiInstance, zapiToken: s.zapiToken, zapiClientToken: s.zapiClientToken,
    currentPlan: s.currentPlan, userProfile: s.userProfile, showToast: s.showToast,
  }))

  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [msg,      setMsg]      = useState('')
  const [target,   setTarget]   = useState('all')
  const [sending,  setSending]  = useState(false)
  const [history,  setHistory]  = useState<{ text: string; sent: number; time: string }[]>([])
  const [planGate, setPlanGate] = useState(false)

  const hasAccess = getPlanAccess('whatsapp', currentPlan, userProfile?.email)
  const zapiReady = !!(zapiInstance && zapiToken)

  function addUser() {
    if (!name || !phone) { showToast('Preencha nome e número.'); return }
    addWaUser({ name, phone: phone.replace(/\D/g, '') })
    setName(''); setPhone('')
    showToast(t(lang, 'user_added'))
  }

  async function send() {
    if (!hasAccess) { setPlanGate(true); return }
    if (!msg) { showToast(t(lang, 'fill_wa')); return }
    if (!waUsers.length) { showToast(t(lang, 'no_users_wa')); return }
    if (!zapiReady) { showToast('⚠️ Configure a Z-API em Configurações primeiro.'); return }

    const targets = target === 'all' ? waUsers : [waUsers[parseInt(target)]]
    setSending(true)
    let sent = 0
    for (const u of targets) {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: zapiInstance, token: zapiToken, clientToken: zapiClientToken, phone: u.phone, message: msg }),
      })
      if (res.ok) sent++
    }
    setSending(false)
    setHistory(h => [{ text: msg.substring(0, 60), sent, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...h])
    setMsg('')
    showToast(`✅ ${sent} usuário(s) notificado(s)!`)
  }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {/* Z-API banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid', marginBottom: 20, fontSize: 13, background: zapiReady ? 'rgba(34,211,160,0.07)' : 'rgba(245,158,11,0.07)', borderColor: zapiReady ? 'rgba(34,211,160,0.25)' : 'rgba(245,158,11,0.25)', color: zapiReady ? 'var(--green)' : 'var(--amber)' }}>
          {zapiReady ? '✅ Z-API conectada — mensagens prontas para envio' : '⚠️ Z-API não configurada — vá em Configurações para conectar'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: add users */}
          <div>
            <div className="sec">{t(lang, 'wa_setup_title')}</div>
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.7 }}>
                Cadastre o nome e número de cada pessoa que receberá notificações.
              </div>
              <div style={{ marginBottom: 8 }}><input className="input-field" placeholder="Nome do usuário" value={name} onChange={e => setName(e.target.value)} /></div>
              <div style={{ marginBottom: 10 }}><input className="input-field" type="tel" placeholder="Número: 5511999998888 (sem + ou espaços)" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <button className="btn-wa" onClick={addUser}>+ {t(lang, 'wa_add_user')}</button>
            </div>

            <div className="sec">{t(lang, 'wa_users')}</div>
            <div className="card">
              {!waUsers.length ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)', fontSize: 14 }}>{t(lang, 'wa_no_users')}</div>
              ) : waUsers.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < waUsers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{u.phone}</div>
                  </div>
                  <button onClick={() => removeWaUser(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 18, cursor: 'pointer', padding: 4 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: send */}
          <div>
            <div className="sec">{t(lang, 'wa_send_now')}</div>
            <div className="card">
              <div style={{ marginBottom: 8 }}>
                <textarea className="input-field" rows={4} placeholder='Ex: "Reunião em 30 minutos! Link: meet.google.com/abc"' value={msg} onChange={e => setMsg(e.target.value)} />
              </div>
              <select className="input-field" value={target} onChange={e => setTarget(e.target.value)} style={{ marginBottom: 10 }}>
                <option value="all">{t(lang, 'wa_all_users')}</option>
                {waUsers.map((u, i) => <option key={i} value={i}>{u.name}</option>)}
              </select>
              <button className="btn-wa" onClick={send} disabled={sending}>
                💬 {sending ? 'Enviando...' : t(lang, 'wa_send_btn')}
              </button>
            </div>

            <div className="sec">{t(lang, 'wa_history')}</div>
            <div className="card">
              {!history.length ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text3)', fontSize: 14 }}>{t(lang, 'wa_no_history')}</div>
              ) : history.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.text}{h.text.length >= 60 ? '...' : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{h.sent} usuário(s) · {h.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {planGate && <PlanGateModal feature="whatsapp" onClose={() => setPlanGate(false)} />}
    </AppShell>
  )
}
