'use client'
import { NexusIcon } from './NexusIcon'

interface Props {
  visible: boolean
  status: string
  transcript: string
  onStop: () => void
}

export function JarvisOverlay({ visible, status, transcript, onStop }: Props) {
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600, letterSpacing: 3, color: 'var(--accent2)', textTransform: 'uppercase', opacity: 0.7 }}>
        NEXUS · JARVIS MODE
      </div>

      {/* Ring */}
      <div style={{ width: 120, height: 120, borderRadius: '50%', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'jarvisSpin 3s linear infinite' }}>
        <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(124,109,250,0.3)', animation: 'jarvisSpin 2s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px dashed rgba(124,109,250,0.15)' }} />
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,109,250,0.3) 0%, rgba(124,109,250,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'jarvisPulse 1.5s ease-in-out infinite' }}>
          <NexusIcon size={32} />
        </div>
      </div>

      {/* Waves */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 32 }}>
        {[8, 20, 32, 20, 8].map((h, i) => (
          <div key={i} style={{ width: 4, height: h, borderRadius: 99, background: 'var(--accent2)', animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite` }} />
        ))}
      </div>

      <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, textAlign: 'center', maxWidth: 320 }}>{status}</div>
      {transcript && <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', maxWidth: 320, fontStyle: 'italic' }}>{transcript}</div>}

      <button onClick={onStop} style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 99, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        ✕ Parar
      </button>
    </div>
  )
}
