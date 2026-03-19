'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const {
    lang, userProfile, geminiKey, zapiInstance, zapiToken,
    zapiClientToken, mpPublicKey, setSettings, setLang, logout, showToast,
  } = useStore(s => ({
    lang: s.lang, userProfile: s.userProfile,
    geminiKey: s.geminiKey, zapiInstance: s.zapiInstance,
    zapiToken: s.zapiToken, zapiClientToken: s.zapiClientToken,
    mpPublicKey: s.mpPublicKey, setSettings: s.setSettings,
    setLang: s.setLang, logout: s.logout, showToast: s.showToast,
  }))
  const router = useRouter()

  const [gkVal,  setGkVal]  = useState(geminiKey)
  const [ziVal,  setZiVal]  = useState(zapiInstance)
  const [ztVal,  setZtVal]  = useState(zapiToken)
  const [zcVal,  setZcVal]  = useState(zapiClientToken)
  const [mpVal,  setMpVal]  = useState(mpPublicKey)

  function saveGemini() {
    setSettings({ geminiKey: gkVal.trim() })
    showToast(t(lang, 'ai_activated'))
  }
  function saveZapi() {
    setSettings({ zapiInstance: ziVal.trim(), zapiToken: ztVal.trim(), zapiClientToken: zcVal.trim() })
    showToast('✅ Z-API configurada!')
  }
  function saveMP() {
    setSettings({ mpPublicKey: mpVal.trim() })
    showToast('✅ Mercado Pago configurado!')
  }
  function doLogout() {
    logout()
    router.replace('/login')
    showToast(t(lang, 'logged_out'))
  }

  const zapiReady = !!(ziVal && ztVal)

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div>
            <div className="sec">{t(lang, 'set_profile')}</div>
            <div className="card">
              {userProfile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne' }}>{userProfile.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{userProfile.email}</div>
                    <span className="badge badge-green" style={{ marginTop: 6 }}>✓ Google {t(lang, 'connected')}</span>
                  </div>
                </div>
              )}
              <button
                className="btn-primary"
                style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}
                onClick={doLogout}
              >
                {t(lang, 'btn_logout')}
              </button>
            </div>

            <div className="sec">{t(lang, 'set_language')}</div>
            <div className="card">
              {(['pt', 'en', 'es'] as const).map((v, i) => {
                const labels = ['🇧🇷 Português', '🇺🇸 English', '🇪🇸 Español']
                return (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <label style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>{labels[i]}</label>
                    <input
                      type="radio" name="lang" value={v}
                      checked={lang === v}
                      onChange={() => setLang(v)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="sec">Automações rápidas</div>
            <div className="card">
              {['Avisar no WhatsApp automaticamente', 'Sugerir horários ideais', 'Resumo diário às 08h'].map((label, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <label style={{ fontSize: 14, color: 'var(--text)' }}>{label}</label>
                  <div className="toggle on" onClick={e => (e.currentTarget as HTMLElement).classList.toggle('on')} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div>
            <div className="sec">{t(lang, 'set_gemini')}</div>
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                {t(lang, 'gemini_desc')} · ou use <code style={{ color: 'var(--accent2)' }}>OPENROUTER_API_KEY</code> no Vercel
              </div>
              <input
                className="input-field"
                type="password"
                placeholder="AIza... (Gemini) ou sk-or-... (OpenRouter)"
                value={gkVal}
                onChange={e => setGkVal(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <button className="btn-primary" onClick={saveGemini}>
                {t(lang, 'btn_save_key')}
              </button>
            </div>

            <div className="sec">WhatsApp · Z-API</div>
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.7 }}>
                Crie sua conta em{' '}
                <a href="https://z-api.io" target="_blank" rel="noreferrer" style={{ color: 'var(--wa)' }}>z-api.io</a>
                {' '}→ crie uma instância → conecte seu WhatsApp pelo QR Code.
              </div>
              <input className="input-field" placeholder="Instance ID (ex: 3D5F6G...)" value={ziVal} onChange={e => setZiVal(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="input-field" type="password" placeholder="Token (ex: ABC123...)" value={ztVal} onChange={e => setZtVal(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="input-field" placeholder="Client-Token (opcional)" value={zcVal} onChange={e => setZcVal(e.target.value)} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: zapiReady ? 'var(--green)' : 'var(--text3)', marginBottom: 8 }}>
                {zapiReady ? '✅ Z-API configurada' : 'Não configurado'}
              </div>
              <button className="btn-wa" onClick={saveZapi}>
                💾 Salvar credenciais Z-API
              </button>
            </div>

            <div className="sec">Mercado Pago</div>
            <div className="card">
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.6 }}>
                Chave pública para ativar pagamentos reais no app.
              </div>
              <input
                className="input-field"
                placeholder="APP_USR-xxxx... (Public Key)"
                value={mpVal}
                onChange={e => setMpVal(e.target.value)}
                style={{ marginBottom: 4 }}
              />
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>
                Obtenha em <b>mercadopago.com.br → Credenciais</b>
              </div>
              <button
                className="btn-primary"
                style={{ background: 'rgba(0,158,227,0.2)', color: '#009EE3', border: '1px solid rgba(0,158,227,0.3)' }}
                onClick={saveMP}
              >
                💳 Salvar chave MP
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
