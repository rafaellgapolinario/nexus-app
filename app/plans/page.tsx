'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import type { Plan } from '@/lib/types'

const PLANS = [
  {
    id: 'free' as Plan, label: 'Free', price: 'Grátis', sub: 'Para sempre',
    color: 'var(--text2)', badge: 'Gratuito',
    features: [
      { ok: true, text: 'Google Calendar integrado' },
      { ok: true, text: 'Dashboard de produtividade' },
      { ok: true, text: 'Chat IA (básico)' },
      { ok: false, text: 'WhatsApp automático' },
      { ok: false, text: 'Automações' },
      { ok: false, text: 'IA ilimitada' },
    ],
  },
  {
    id: 'pro' as Plan, label: 'Pro', price: 'R$ 29', sub: '/mês', popular: true,
    color: 'var(--accent2)', badge: 'Pro ⭐',
    features: [
      { ok: true, text: 'Google Calendar integrado' },
      { ok: true, text: 'Dashboard de produtividade' },
      { ok: true, text: 'Chat IA ilimitado' },
      { ok: true, text: 'WhatsApp automático (Z-API)' },
      { ok: true, text: '5 automações personalizadas' },
      { ok: false, text: 'Multi-usuário' },
    ],
  },
  {
    id: 'business' as Plan, label: 'Business', price: 'R$ 97', sub: '/mês',
    color: 'var(--amber)', badge: 'Business 🚀',
    features: [
      { ok: true, text: 'Google Calendar integrado' },
      { ok: true, text: 'Dashboard de produtividade' },
      { ok: true, text: 'Chat IA ilimitado' },
      { ok: true, text: 'WhatsApp automático (Z-API)' },
      { ok: true, text: 'Automações ilimitadas' },
      { ok: true, text: 'Multi-usuário (até 10 pessoas)' },
    ],
  },
]

export default function PlansPage() {
  const { currentPlan, setPlan, showToast } = useStore(s => ({ currentPlan: s.currentPlan, setPlan: s.setPlan, showToast: s.showToast }))
  const [annual, setAnnual] = useState(false)
  const [checkout, setCheckout] = useState<Plan | null>(null)

  function select(plan: Plan) {
    if (plan === currentPlan) { showToast('Você já está neste plano!'); return }
    if (plan === 'free') {
      if (confirm('Fazer downgrade para o plano Free? Você perderá acesso ao WhatsApp e automações.')) {
        setPlan('free'); showToast('Plano alterado para Free.')
      }
      return
    }
    setCheckout(plan)
  }

  function activateDemo(plan: Plan) {
    setPlan(plan)
    setCheckout(null)
    showToast(`🎉 Plano ${plan === 'pro' ? 'Pro ⭐' : 'Business 🚀'} ativado!`)
  }

  const planBannerStyle = { free: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border)' }, pro: { bg: 'rgba(124,109,250,0.08)', border: 'rgba(124,109,250,0.3)' }, business: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' } }
  const pb = planBannerStyle[currentPlan]

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {/* Current plan banner */}
        <div style={{ background: pb.bg, border: `1px solid ${pb.border}`, borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>SEU PLANO ATUAL</div>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: PLANS.find(p => p.id === currentPlan)?.color }}>{PLANS.find(p => p.id === currentPlan)?.badge}</div>
          </div>
          {currentPlan === 'free' && <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'right' }}>Faça upgrade para desbloquear<br/>WhatsApp, automações e IA ilimitada</div>}
          {currentPlan === 'pro'  && <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'right' }}>✅ WhatsApp ativo · IA ilimitada<br/>5 automações disponíveis</div>}
          {currentPlan === 'business' && <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'right' }}>✅ Todos os recursos ativos<br/>Suporte prioritário 24h</div>}
        </div>

        {/* Annual toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: annual ? 'var(--text2)' : 'var(--text)' }}>Mensal</span>
          <div className={`toggle ${annual ? 'on' : ''}`} onClick={() => setAnnual(!annual)} />
          <span style={{ fontSize: 14, color: annual ? 'var(--text)' : 'var(--text2)' }}>Anual <span className="badge badge-green">-20%</span></span>
        </div>

        {/* Plan cards */}
        <div id="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{ background: 'var(--bg2)', border: `1px solid ${plan.popular ? 'rgba(124,109,250,0.5)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 24, position: 'relative' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: '0 0 8px 8px' }}>MAIS POPULAR</div>}
              <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800 }}>
                  {plan.id === 'free' ? plan.price : annual ? (plan.id === 'pro' ? 'R$ 23' : 'R$ 78') : plan.price}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{plan.id === 'free' ? '' : annual ? '/mês (anual)' : plan.sub}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {plan.features.map((f, i) => (
                  <div key={i} className={f.ok ? 'feat-yes' : 'feat-no'}>{f.text}</div>
                ))}
              </div>
              <button
                className={`plan-btn ${plan.id === 'pro' ? 'plan-btn-accent' : plan.id === 'business' ? 'plan-btn-amber' : ''} ${plan.id === currentPlan ? 'plan-btn-current' : ''}`}
                onClick={() => select(plan.id)}
              >
                {plan.id === currentPlan ? '✓ Plano atual' : plan.id === 'free' ? 'Usar Free' : plan.id === 'pro' ? 'Assinar Pro' : 'Assinar Business'}
              </button>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div style={{ textAlign: 'center', padding: 24, background: 'rgba(124,109,250,0.05)', border: '1px solid rgba(124,109,250,0.15)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Garantia de 7 dias</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>Não gostou? Devolvemos 100% do valor sem perguntas.</div>
        </div>
      </div>

      {/* Checkout modal */}
      {checkout && (
        <div onClick={e => e.target === e.currentTarget && setCheckout(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{checkout === 'pro' ? '⭐' : '🚀'}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Plano {checkout === 'pro' ? 'Pro' : 'Business'}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent2)' }}>{annual ? (checkout === 'pro' ? 'R$ 278/ano' : 'R$ 932/ano') : (checkout === 'pro' ? 'R$ 29/mês' : 'R$ 97/mês')}</div>
            </div>
            <div style={{ background: 'rgba(34,211,160,0.07)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              🛡️ <b style={{ color: 'var(--text)' }}>Garantia de 7 dias</b> — se não gostar, devolvemos 100%.
            </div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>
              💳 Stripe / Mercado Pago<br/><span style={{ fontSize: 11 }}>Configure OPENROUTER_API_KEY e integração de pagamentos para produção</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => activateDemo(checkout)}>Ativar plano (demo)</button>
              <button onClick={() => setCheckout(null)} style={{ flex: 1, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 13, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
