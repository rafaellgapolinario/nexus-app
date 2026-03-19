'use client'
import { useStore } from '@/lib/store'

export function Toast() {
  const toast = useStore(s => s.toast)
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg3)', color: 'var(--text)',
      border: '1px solid var(--border2)', padding: '10px 20px',
      borderRadius: 99, fontSize: 13, fontWeight: 500,
      zIndex: 9999, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      animation: 'fadeIn 0.2s ease',
    }}>
      {toast}
    </div>
  )
}
