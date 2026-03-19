'use client'
import React from 'react'
import { useStore, OWNER_EMAIL } from '@/lib/store'
import { t } from '@/lib/translations'
import { NexusIcon } from './NexusIcon'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',            label: 'nav_home' as const,     icon: HomeIcon },
  { href: '/agent',       label: 'nav_agent' as const,    icon: AgentIcon },
  { href: '/calendar',    label: 'nav_calendar' as const, icon: CalendarIcon },
  { href: '/whatsapp',    label: 'nav_whatsapp' as const, icon: WAIcon },
  { href: '/automations', label: null, staticLabel: 'Automações', icon: BoltIcon },
  { href: '/plans',       label: null, staticLabel: 'Planos',     icon: CardIcon },
  { href: '/settings',    label: 'nav_settings' as const, icon: SettingsIcon },
]

const PLAN_COLORS = {
  free:     { label: 'Free',        bg: 'rgba(255,255,255,0.07)', color: '#55556a' },
  pro:      { label: 'Pro ⭐',      bg: 'rgba(124,109,250,0.2)', color: '#a78bfa' },
  business: { label: 'Business 🚀', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
}

export function Sidebar() {
  const { lang, userProfile, currentPlan } = useStore(s => ({
    lang: s.lang, userProfile: s.userProfile, currentPlan: s.currentPlan,
  }))
  const pathname = usePathname()
  const pb = PLAN_COLORS[currentPlan]
  const owner = userProfile?.email === OWNER_EMAIL

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
    color: active ? 'var(--accent2)' : 'var(--text2)',
    fontSize: 14, fontWeight: 500, textDecoration: 'none',
    borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
    background: active ? 'rgba(124,109,250,0.08)' : 'transparent',
    transition: 'all 0.15s', margin: '1px 0',
  })

  return (
    <aside style={{ width: 'var(--sidebar)', flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0 16px', zIndex: 10 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 28px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c6dfa,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NexusIcon size={20} />
        </div>
        <span style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Nexus</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV.map(({ href, label, staticLabel, icon: Icon }) => {
          const active = pathname === href
          const text = label ? t(lang, label) : (staticLabel ?? '')
          return (
            <Link key={href} href={href} style={navItemStyle(active)}>
              <Icon />
              <span>{text}</span>
            </Link>
          )
        })}
        {owner && (
          <Link href="/admin" style={navItemStyle(pathname === '/admin')}>
            <ShieldIcon />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* User card */}
      {userProfile && (
        <div style={{ padding: '0 16px' }}>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textDecoration: 'none' }}>
            <img
              src={userProfile.picture}
              alt=""
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile.given_name || userProfile.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile.email}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, marginTop: 3, display: 'inline-block', background: pb.bg, color: pb.color }}>
                {pb.label}
              </span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}

function HomeIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> }
function AgentIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> }
function CalendarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function WAIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function BoltIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> }
function CardIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function SettingsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function ShieldIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
