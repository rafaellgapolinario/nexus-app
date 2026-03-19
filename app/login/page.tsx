'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/translations'
import { NexusIcon } from '@/components/NexusIcon'
import { Toast } from '@/components/Toast'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const SCOPES    = 'https://www.googleapis.com/auth/calendar openid email profile'

declare global {
  interface Window {
    google: any
  }
}

export default function LoginPage() {
  const { lang, accessToken, setAuth, showToast } = useStore(s => ({
    lang: s.lang, accessToken: s.accessToken, setAuth: s.setAuth, showToast: s.showToast,
  }))
  const router = useRouter()

  // Already logged in → go home
  useEffect(() => {
    if (accessToken) router.replace('/')
  }, [accessToken, router])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  async function startLogin() {
    if (!window.google) { showToast('Aguarde...'); setTimeout(startLogin, 1000); return }
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp: any) => {
        if (resp.error) { showToast('Erro: ' + resp.error); return }
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          })
          const profile = await profileRes.json()
          setAuth(resp.access_token, profile)
          showToast(t(lang, 'logged_in'))
          router.replace('/')
        } catch { showToast(t(lang, 'err_connect')) }
      },
    }).requestAccessToken({ prompt: 'consent' })
  }

  return (
    <>
      <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg)' }}>
        {/* Left panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 30%,rgba(124,109,250,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ marginBottom: 20 }}><NexusIcon size={80} /></div>
          <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, letterSpacing: -2, marginBottom: 8 }}>Nexus</div>
          <div style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>{t(lang, 'login_tagline')}</div>

          <div style={{ marginTop: 40, width: '100%', maxWidth: 400 }}>
            {[
              { icon: '📅', tk: 'feat1_title' as const, sk: 'feat1_sub' as const, bg: 'rgba(124,109,250,0.15)' },
              { icon: '🤖', tk: 'feat2_title' as const, sk: 'feat2_sub' as const, bg: 'rgba(124,109,250,0.15)' },
              { icon: '💬', tk: 'feat3_title' as const, sk: 'feat3_sub' as const, bg: 'rgba(37,211,102,0.12)' },
            ].map(({ icon, tk, sk, bg }) => (
              <div key={tk} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{t(lang, tk)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t(lang, sk)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 420, flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ margin: '0 auto 12px', display: 'flex', justifyContent: 'center' }}><NexusIcon size={48} /></div>
            <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Nexus</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>{t(lang, 'login_welcome')}</div>
          </div>

          <button className="google-btn" onClick={startLogin}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t(lang, 'login_btn')}
          </button>

          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 14, lineHeight: 1.7 }}>
            {t(lang, 'login_terms').split('\n').map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      </div>
      <Toast />
    </>
  )
}
