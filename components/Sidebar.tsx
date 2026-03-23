'use client'
import React from 'react'
import { useStore, OWNER_EMAIL } from '@/lib/store'
import { t } from '@/lib/translations'
import { NexusIcon } from './NexusIcon'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/nexus',       label: null, staticLabel: '⚡ Nexus',      icon: MicIcon,      highlight: true },
  { href: '/',            label: 'nav_home' as const,                 icon: HomeIcon },
  { href: '/notes',       label: null, staticLabel: '📝 Anotações',  icon: NotesIcon },
  { href: '/calendar',    label: 'nav_calendar' as const,             icon: CalendarIcon },
  { href: '/whatsapp',    label: 'nav_whatsapp' as const,             icon: WAIcon },
  { href: '/automations', label: null, staticLabel: 'Automações',     icon: BoltIcon },
  { href: '/plans',       label: null, staticLabel: 'Planos',         icon: CardIcon },
  { href: '/settings',    label: 'nav_settings' as const,             icon: SettingsIcon },
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
        {NAV.map(({ href, label, staticLabel, icon: Icon, highlight }) => {
          const active = pathname === href
          const text = label ? t(lang, label) : (staticLabel ?? '')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
              color: active ? 'var(--accent2)' : highlight ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 14, fontWeight: highlight ? 700 : 500, textDecoration: 'none',
              borderLeft: `3px solid ${active ? 'var(--accent)' : highlight && !active ? 'rgba(124,109,250,0.3)' : 'transparent'}`,
              background: active ? 'rgba(124,109,250,0.08)' : highlight && !active ? 'rgba(124,109,250,0.04)' : 'transparent',
              transition: 'all 0.15s', margin: '1px 0',
            }}>
              <Icon />
              <span>{text}</span>
              {highlight && !active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', marginLeft: 'auto' }} />}
            </Link>
          )
        })}
        {owner && (
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', color: pathname === '/admin' ? 'var(--amber)' : 'var(--text2)', fontSize: 14, fontWeight: 500, textDecoration: 'none', borderLeft: `3px solid ${pathname === '/admin' ? 'var(--amber)' : 'transparent'}`, background: pathname === '/admin' ? 'rgba(245,158,11,0.08)' : 'transparent', transition: 'all 0.15s' }}>
            <ShieldIcon />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* User card */}
      {userProfile && (
        <div style={{ padding: '0 16px' }}>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textDecoration: 'none' }}>
            <img src={userProfile.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.given_name || userProfile.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile.email}</div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, marginTop: 3, display: 'inline-block', background: pb.bg, color: pb.color }}>{pb.label}</span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}

function MicIcon()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> }
function HomeIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> }
function NotesIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function CalendarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function WAIcon()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function BoltIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> }
function CardIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function SettingsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function ShieldIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
