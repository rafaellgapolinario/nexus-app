'use client'
import { useStore } from '@/lib/store'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { t, type TKey } from '@/lib/translations'

interface PageInfo { titleKey?: TKey; title?: string; sub?: string }

const TITLES: Record<string, PageInfo> = {
  '/':            { titleKey: 'nav_home',     sub: '' },
  '/nexus':       { title: '⚡ Nexus',        sub: 'Assistente de voz — diga "Hey Nexus"' },
  '/notes':       { title: '📝 Anotações',    sub: 'Notas, tarefas e lembretes' },
  '/calendar':    { titleKey: 'nav_calendar', sub: 'Google Calendar' },
  '/whatsapp':    { titleKey: 'nav_whatsapp', sub: 'Z-API' },
  '/automations': { title: 'Automações',      sub: 'Se X → Faça Y' },
  '/plans':       { title: 'Planos & Preços', sub: '' },
  '/settings':    { titleKey: 'nav_settings', sub: '' },
  '/admin':       { title: '🛡️ Painel Admin', sub: 'Exclusivo Owner' },
}

export function Topbar() {
  const { lang, userProfile, setLang } = useStore(s => ({
    lang: s.lang, userProfile: s.userProfile, setLang: s.setLang,
  }))
  const pathname = usePathname()
  const info = TITLES[pathname] || TITLES['/']
  const title = info.titleKey ? t(lang, info.titleKey) : (info.title || 'Nexus')
  const now = new Date()
  const dateStr = now.toLocaleDateString(
    lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR',
    { weekday: 'long', day: 'numeric', month: 'long' }
  )
  const sub = info.sub !== undefined ? info.sub : (userProfile ? dateStr : '')

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)' }}>
      <div>
        <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={lang}
          onChange={e => setLang(e.target.value as 'pt' | 'en' | 'es')}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', outline: 'none' }}
        >
          <option value="pt">🌐 PT</option>
          <option value="en">🌐 EN</option>
          <option value="es">🌐 ES</option>
        </select>
        {userProfile && (
          <Link href="/settings">
            <img src={userProfile.picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
          </Link>
        )}
      </div>
    </header>
  )
}
