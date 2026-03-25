'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import type { Plan } from '@/lib/types'

// ── Config de planos ──────────────────────────────────────────────────────────
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
      { ok: true,  text: 'White-label disponível' },
    ],
  },
]

const FAQS = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Cancele quando quiser, sem multas ou burocracia. Você mantém acesso até o fim do período pago.' },
  { q: 'A garantia de 14 dias funciona mesmo?', a: 'Sim. Se por qualquer motivo não ficar satisfeito nos primeiros 14 dias, devolvemos 100% do valor — sem perguntas.' },
  { q: 'O plano anual tem desconto?', a: 'Sim! No anual você economiza 33% (Pro) e 33% (Business), pagando tudo de uma vez com desconto.' },
  { q: 'Posso trocar de plano depois?', a: 'Pode! Upgrade ou downgrade a qualquer momento. A diferença é calculada proporcionalmente.' },
  { q: 'Como funciona o multi-usuário?', a: 'No Business, você convida até 10 membros. Cada um tem seu login e acessa o painel compartilhado da equipe.' },
]

// ── Componentes ───────────────────────────────────────────────────────────────
function FeatureRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        background: ok ? 'rgba(34,211,160,0.15)' : 'rgba(107,114,128,0.1)',
        border: `1px solid ${ok ? 'rgba(34,211,160,0.3)' : 'rgba(107,114,128,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: ok ? 'var(--green)' : 'var(--text3)',
      }}>
        {ok ? '✓' : '×'}
      </div>
      <span style={{ fontSize: 13, color: ok ? 'var(--text)' : 'var(--text3)' }}>{text}</span>
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
    if (plan === currentPlan) { showToast('Você já está neste plano!'); return }
    if (plan === 'free') {
      if (confirm('Fazer downgrade para Free? Você perderá acesso às funcionalidades Pro.')) {
        setPlan('free'); showToast('Plano alterado para Free.')
      }
      return
    }
    setCheckout(plan)
  }

  function activateDemo(plan: Plan) {
    setPlan(plan)
    setCheckout(null)
    showToast(`🎉 Plano ${PLANS.find(p => p.id === plan)?.badge} ativado!`)
  }

  function getPrice(plan: typeof PLANS[0]) {
    if (plan.monthlyPrice === 0) return 'Grátis'
    return annual
      ? `R$ ${(plan.annualPrice / 12).toFixed(2)}`
      : `R$ ${plan.monthlyPrice.toFixed(2)}`
  }

  const checkoutPlan = PLANS.find(p => p.id === checkout)

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Escolha seu plano
          </div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>
            Comece grátis. Faça upgrade quando precisar.
          </div>
        </div>

        {/* Banner plano atual */}
        <div style={{
          background: 'var(--bg2)',
          border: `1px solid ${current.color === 'var(--text2)' ? 'var(--border)' : current.color + '30'}`,
          borderRadius: 'var(--radius)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.8 }}>PLANO ATUAL</div>
            <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: current.color }}>{current.badge}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {currentPlan === 'free' && '50 msgs/dia · 3 hábitos · sem WhatsApp'}
            {currentPlan === 'pro' && '✅ IA ilimitada · Voz neural · WhatsApp'}
            {currentPlan === 'business' && '✅ Todos os recursos · Multi-usuário · API'}
          </div>
        </div>

        {/* Toggle anual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          <span style={{ fontSize: 14, color: annual ? 'var(--text2)' : 'var(--text)', fontWeight: annual ? 400 : 600 }}>Mensal</span>
          <div
            onClick={() => setAnnual(!annual)}
            style={{
              width: 46, height: 26, borderRadius: 99, cursor: 'pointer', position: 'relative',
              background: annual ? 'var(--accent)' : 'var(--bg3)',
              border: '1px solid var(--border2)', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: annual ? 22 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize: 14, color: annual ? 'var(--text)' : 'var(--text2)', fontWeight: annual ? 600 : 400 }}>
            Anual{' '}
            <span style={{
              fontSize: 11, fontWeight: 700, background: 'rgba(34,211,160,0.15)',
              color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)',
              borderRadius: 99, padding: '2px 8px', marginLeft: 4,
            }}>-33%</span>
          </span>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => {
            const isCurrentPlan = plan.id === currentPlan
            return (
              <div key={plan.id} style={{
                background: 'var(--bg2)',
                border: `1px solid ${plan.popular ? 'rgba(124,109,250,0.5)' : isCurrentPlan ? 'rgba(34,211,160,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '24px 22px',
                position: 'relative',
                boxShadow: plan.popular ? '0 0 40px rgba(124,109,250,0.08)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '3px 14px', borderRadius: '0 0 10px 10px', letterSpacing: 0.8,
                  }}>MAIS POPULAR</div>
                )}
                {isCurrentPlan && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(34,211,160,0.15)', color: 'var(--green)',
                    border: '1px solid rgba(34,211,160,0.25)',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  }}>✓ ATUAL</div>
                )}

                <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: plan.color, marginBottom: 6 }}>
                  {plan.label}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: 'Syne', fontSize: 34, fontWeight: 900 }}>
                    {getPrice(plan)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                      {annual ? '/mês (faturado anual)' : '/mês'}
                    </span>
                  )}
                  {annual && plan.monthlyPrice > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
                      Total: R$ {plan.annualPrice}/ano (economize R$ {(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(0)})
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 22 }}>
                  {plan.features.map((f, i) => <FeatureRow key={i} {...f} />)}
                </div>

                <button
                  onClick={() => handleSelect(plan.id)}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14,
                    fontWeight: 700, cursor: isCurrentPlan ? 'default' : 'pointer',
                    border: 'none', transition: 'all 0.2s',
                    background: isCurrentPlan
                      ? 'var(--bg3)'
                      : plan.id === 'pro'
                      ? 'var(--accent)'
                      : plan.id === 'business'
                      ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                      : 'var(--bg3)',
                    color: isCurrentPlan ? 'var(--text3)' : plan.id === 'free' ? 'var(--text2)' : '#fff',
                  }}
                >
                  {isCurrentPlan ? '✓ Plano atual' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Garantia */}
        <div style={{
          textAlign: 'center', padding: '28px 24px',
          background: 'linear-gradient(135deg,rgba(34,211,160,0.07),rgba(34,211,160,0.02))',
          border: '1px solid rgba(34,211,160,0.15)', borderRadius: 'var(--radius)', marginBottom: 36,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Garantia de 14 dias sem risco</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
            Experimente qualquer plano por 14 dias. Se não ficar satisfeito por qualquer motivo, devolvemos 100% do valor — sem burocracia e sem perguntas.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
            Perguntas frequentes
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{
              borderBottom: '1px solid var(--border)', overflow: 'hidden',
            }}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 0', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{faq.q}</span>
                <span style={{
                  fontSize: 18, color: 'var(--text3)', flexShrink: 0, marginLeft: 12,
                  transform: faqOpen === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                }}>+</span>
              </button>
              {faqOpen === i && (
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, paddingBottom: 16 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal checkout */}
      {checkout && checkoutPlan && (
        <div
          onClick={e => e.target === e.currentTarget && setCheckout(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', padding: '32px 28px', width: '100%', maxWidth: 420,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{checkout === 'pro' ? '⭐' : '🚀'}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                Plano {checkoutPlan.label}
              </div>
              <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: checkoutPlan.color }}>
                {annual
                  ? `R$ ${checkoutPlan.annualPrice}/ano`
                  : `R$ ${checkoutPlan.monthlyPrice.toFixed(2)}/mês`}
              </div>
              {annual && (
                <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
                  Equivale a R$ {(checkoutPlan.annualPrice / 12).toFixed(2)}/mês
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(34,211,160,0.07)', border: '1px solid rgba(34,211,160,0.2)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
            }}>
              🛡️ <b style={{ color: 'var(--text)' }}>Garantia de 14 dias</b> — não gostou? Devolvemos 100%.
            </div>

            {/* Botões de pagamento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => activateDemo(checkout)}
                style={{
                  padding: '13px 0', borderRadius: 10, border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                💳 Pagar com cartão (Stripe)
              </button>
              <button
                onClick={() => activateDemo(checkout)}
                style={{
                  padding: '13px 0', borderRadius: 10, border: 'none',
                  background: '#009ee3', color: '#fff', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                💙 Pagar com Mercado Pago
              </button>
              <button
                onClick={() => activateDemo(checkout)}
                style={{
                  padding: '13px 0', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#32bcad,#1a9488)', color: '#fff', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                📱 Pagar com PIX
              </button>
            </div>

            <div style={{
              fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5, marginBottom: 16,
            }}>
              Configure <code>STRIPE_KEY</code> ou <code>MP_PUBLIC_KEY</code> no Vercel para ativar pagamentos reais.
              No momento, o botão ativa o plano em modo demo.
            </div>

            <button
              onClick={() => setCheckout(null)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
