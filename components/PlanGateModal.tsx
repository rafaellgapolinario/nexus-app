'use client'
import { useRouter } from 'next/navigation'

interface Props { feature: string; onClose: () => void }

const NAMES: Record<string, string> = {
  whatsapp: 'WhatsApp automático', ai_unlimited: 'IA ilimitada',
  automations: 'Automações', multi_user: 'Multi-usuário', api_access: 'API Access',
}

export function PlanGateModal({ feature, onClose }: Props) {
  const router = useRouter()
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 32, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{NAMES[feature] || feature}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
          Esta funcionalidade está disponível nos planos <b style={{ color: 'var(--accent2)' }}>Pro</b> e <b style={{ color: 'var(--amber)' }}>Business</b>.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => { onClose(); router.push('/plans') }} style={{ flex: 1 }}>Ver planos</button>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 14, cursor: 'pointer' }}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
