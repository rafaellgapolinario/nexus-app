'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 16, background: 'var(--bg)' }}>
      <div style={{ fontSize: 48 }}>⚡</div>
      <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>Página não encontrada</div>
      <Link href="/" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        Voltar ao início
      </Link>
    </div>
  )
}
