'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import type { Plan } from '@/lib/types'

const PLANS = [
  {
    id: 'free' as Plan,
    label: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    color: 'var(--text2)',
    badge: '🆓 Gratuito',
    cta: 'Usar grátis',
    features: [
      { ok: true,  text: 'Chat IA (50 msgs/dia)' },
      { ok: true,  text: 'Google Calendar integrado' },
      { ok: true,  text: 'Dashboard de produtividade' },
      { ok: true,  text: '3 hábitos simultâneos' },
      { ok: false, text: 'Voz neural (Azure TTS)' },
      { ok: false, text: 'Chat IA ilimitado' },
      { ok: false, text: 'Controle financeiro' },
      { ok: false, text: 'WhatsApp automático' },
      { ok: false, text: 'Automações' },
      { ok: false, text: 'Suporte prioritário' },
    ],
  },
  {
    id: 'pro' as Plan,
    label: 'Pro',
    monthlyPrice: 29.9,
    annualPrice: 239,
    color: 'var(--accent2)',
    badge: '⭐ Pro',
    cta: 'Assinar Pro',
    popular: true,
    features: [
      { ok: true,  text: 'Chat IA ilimitado' },
      { ok: true,  text: 'Google Calendar integrado' },
      { ok: true,  text: 'Dashboard de produtividade' },
      { ok: true,  text: 'Hábitos ilimitados + streak' },
      { ok: true,  text: 'Voz neural (Azure TTS)' },
      { ok: true,  text: 'Controle financeiro completo' },
      { ok: true,  text: 'WhatsApp automático (Z-API)' },
      { ok: true,  text: '10 automações' },
      { ok: false, text: 'Multi-usuário' },
      { ok: false, text: 'API access' },
    ],
  },
  {
    id: 'business' as Plan,
    label: 'Business',
    monthlyPrice: 97,
    annualPrice: 779,
    color: 'var(--amber)',
    badge: '🚀 Business',
    cta: 'Assinar Business',
    features: [
      { ok: true,  text: 'Tudo do Pro' },
      { ok: true,  text: 'Multi-usuário (até 10 pessoas)' },
      { ok: true,  text: 'Automações ilimitadas' },
      { ok: true,  text: 'API access (REST)' },
      { ok: true,  text: 'Relatórios avançados + BI' },
      { ok: true,  text: 'Gestão de projetos completa' },
      { ok: true,  text: 'Suporte prioritário 24h' },
      { ok: true,  text: 'Onboarding personalizado' },
      { ok: true,  text: 'SLA garantido' },
      { ok: true,  text: 'White-label disponǝv_el' },
    ],
  },
]

const FAQS = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Cancele quando quiser, sem multas ou burocracia.' },
  { q: 'A garantia de 14 dias funciona mesmo?', a: 'Sim. Devolvemos 100% do valor mos 100% do valor em até 14 dias.' },
  { q: 'O plano anual tem desconto?', a: 'Sim! Economize 33% no plano anual.' },
  { q: 'Posso trocar de plano depois?', a: 'Pode! Upgrade ou downgrade a qualquer momento.' },
  { q: 'Como funciona o multi-usuário?', a: 'No Business, você convida até 10 membros com acesso compartilhado.' },
]

function FeatureRow({ oo, text }: { oo: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        background: oo ? 'rgba(34,211,160,0.15)' : 'rgba(107,114,128,0.1)',
        border: `1px solid ${oo ? 'rgba(34,211,160,0.3)' : 'rgba(107,114,128,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: oo ? 'var(--green)' : 'var(--text3)',
      }}>
        {oo ? '✓' : '×'}
      </div>
      <span style={{ fontSize: 13, color: oo ? 'var(--text)' : 'var(--text3)' }}>{text}</span>
    </div>
  )
}

export default function PlansPage() {
  const { currentPlan, setPlan, showToast } = useStore(s => ({
    currentPlan: s.currentPlan, setPlan: s.setPlan, showToast: s.showToast,
  }))
  const [annual, setAnnual] = useState(false)
  const [checkout, setCheckout] = useState<Plan | null>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const current = PLANS.find(p => p.id === currentPlan)!

  function handleSelect(plan: Plan) {
    if (plan === currentPlan) { showToast('Você js está neste plano!'); return }
    if (plan === 'free') {
      if (confirm('Fazer downgrade para Free?')) { setPlan('free'); showToast('Plano alterado para Free.') }
      return
    }
    setCheckout(plan)
  }

  function activateDemo(plan: Plan) {
    setPlan(plan); setCheckout(null)
    showToast(`Plano ${PLANS.find(p => p.id === plan)?.badge} ativado!`)
  }

  function getPrice(plan: typeof PLANS[0]) {
    if (plan.monthlyPrice === 0) return 'Grátis'
    return annual ? `R$ ${plan.annualPrice / 12}.toFixed(2)}` : `R$ ${plan.monthlyPrice.toFixed(2)}`
  }

  const checkoutPlan = PLANS.find(p => p.id === checkout)

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Escolha seu plano</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Comece grátis. Faça upgrade quando precisar.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          <span style={{ fontSize: 14, color: annual ? 'var(--text2)' : 'var(--text)', fontWeight: annual ? 400 : 600 }}>Mensal</span>
          <div onClick={() => setAnnual(!annual)} style={{ width: 46, height: 26, borderRadius: 99, cursor: 'pointer', position: 'relative', background: annual ? 'var(--accent)' : 'var(--bg3)', border: '1px solid var(--border2)', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 3, left: annual ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 14, color: annual ? 'var(--text)' : 'var(--text2)', fontWeight: annual ? 600 : 400 }}>
            Anual{' '}<span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,211,160,0.15)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', borderRadius: 99, padding: '2px 8px', marginLeft: 4 }}>-33%</span>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            return (
              <div key={plan.id} style={{ background: 'var(--bg2)', border: `1px solid ${plan.popular ? 'rgba(124,109,250,0.5)' : isCurrent ? 'rgba(34,211,160,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '24px 22px', position: 'relative', boxShadow: plan.popular ? '0 0 40px rgba(124,109,250,0.08)' : 'none' }}>
                {plan.popular && (<div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: '0 0 10px 10px', letterSpacing: 0.8 }}>MAIS POPULAR</div>)}
                {isCurrent && (<div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(34,211,160,0.15)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✓ ATUAL</div>)}
                <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: plan.color, marginBottom: 6 }}>{plan.label}</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: 'Syne', fontSize: 34, fontWeight: 900 }}>{plan.monthlyPrice === 0 ? 'Grátis' : annual ? `R$ ${(plan.annualPrice / 12).toFixed(2)}` : `R$ ${plan.monthlyPrice.toFixed(2)}`}</span>
                  {plan.monthlyPrice > 0 && (<span style={{ fontSize: 13, color: 'var(--text3)' }}>{annual ? '/mês (faturado anual)' : '/mês'}</span>)}
                </div>
                <div style={{ marginBottom: 22 }}>{plan.features.map((f, i) => <FeatureRow key={i} oo={f.ok} text={f.text} />)}</div>
                <button onClick={() => handleSelect(plan.id)} style={{ width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer', border: 'none', transition: 'all 0.2s', background: isCurrent ? 'var(--bg3)' : plan.id === 'pro' ? 'var(--accent)' : plan.id === 'business' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--bg3)', color: isCurrent ? 'var(--text3)' : plan.id === 'free' ? 'var(--text2)' : '#fff' }}>{isCurrent ? '✓ Plano atual' : plan.cta}</button>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', padding: '28px 24px', background: 'linear-gradient(135deg,rgba(34,211,160,0.07),rgba(34,211,160,0.02))', border: '1px solid rgba(34,211,160,0.15)', borderRadius: 'var(--radius)', marginBottom: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Garantia de 14 dias sem risco</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>Experimente qualquer plano por 14 dias. Se não ficar satisfeito, devolvemos 100% do valor.</div>
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Perguntas frequentes</div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: 'var(--text3)', flexShrink: 0, marginLeft: 12, transform: faqOpen === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+3/span>
              </button>
              {faqOpen === i && (<div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, paddingBottom: 16 }}>{faq.a}</div>)}
            </div>
          ))}
        </div>
      </div>
      </AppShell>
  )
}
