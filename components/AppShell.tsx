'use client'
import React, { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar }   from './Sidebar'
import { Topbar }    from './Topbar'
import { BottomNav } from './BottomNav'
import { Toast }     from './Toast'
import { NexusIcon } from './NexusIcon'

export function AppShell({ children }: { children: React.ReactNode }) {
  const accessToken = useStore(s => s.accessToken)
  const router   = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !accessToken && pathname !== '/login') {
      router.replace('/login')
    }
  }, [mounted, accessToken, pathname, router])

  // Show spinner until hydrated
  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
        <NexusIcon size={48} />
        <div className="spinner animate-spin-slow" />
      </div>
    )
  }

  // Not logged in — let redirect happen
  if (!accessToken && pathname !== '/login') return null

  // Login page has its own layout
  if (pathname === '/login') return <>{children}<Toast /></>

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <div className="sidebar-desktop"><Sidebar /></div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <BottomNav />
      </div>
      <Toast />

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .bottom-nav-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
