'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'

export function BottomNav() {
  const { lang } = useStore(s => ({ lang: s.lang }))
  const pathname = usePathname()
  const items = [
    { href: '/',         label: t(lang, 'nav_home'),     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
    { href: '/calendar', label: t(lang, 'nav_calendar'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { href: '/nexus',    label: 'Nexus',                 icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, center: true },
    { href: '/whatsapp', label: 'WhatsApp',              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/settings', label: t(lang, 'nav_settings'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]
  return (
    <nav style={{ display: 'none', background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '8px 4px 12px', flexShrink: 0, alignItems: 'center' }} className="bottom-nav-mobile">
      {items.map(({ href, label, icon, center }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0', color: active ? 'var(--accent2)' : 'var(--text3)', transition: 'color 0.2s' }}>
            {center ? (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: active ? 'var(--accent)' : 'linear-gradient(135deg,#7c6dfa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -12, boxShadow: '0 0 20px rgba(124,109,250,0.5)', border: '3px solid var(--bg2)' }}>{icon}</div>
            ) : icon}
            <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
