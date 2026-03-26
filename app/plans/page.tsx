'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

const PLANS = [
  { id: 'free', label: 'Free', monthlyPrice: 0, annualPrice: 0, color: 'var(--text2)', badge: '🆓 Gratuito', cta: 'Usar grátis', features: [{ ok:true, text:'Chat IA (50 msgs/dia)' },{ ok:true, text:'Google Calendar' },{ ok:true, text:'Dashboard' },{ ok:true, text:'3 hábitos' },{ ok:false, text:'Voz neural (Azure TTS)' },{ ok:false, text:'Chat ilimitado' },{ ok:false, text:'Controle financeiro' },{ ok:false, text:'WhatsApp' }] },
  { id: 'pro', label: 'Pro', monthlyPrice: 29.9, annualPrice: 239, color: 'var(--accent2)', badge: '⭐ Pro', cta: 'Assinar Pro',popular:true, features: [{ ok:true, text:'Chat IA ilimitado' },{ ok:true, text:'Google Calendar' },{ ok:true, text:'Dashboard' },{ ok:true, text:'Hábitos ilimitados' },{ ok:true, text:'Voz neural (Azure TTS)' },{ ok:true, text:'Controle financeiro' },{ ok:true, text:'WhatsApp' },{ ok:true, text:'10 automações' },{ ok:false, text:'Multi-usuário' },{ ok:false, text:'API access' }] },
  { id: 'business', label: 'Business', monthlyPrice: 97, annualPrice: 779, color: 'var(--amber)', badge: '🚀 Business', cta: 'Assinar Business', features: [{ ok:true, text:'Tudo do Pro' },{ ok:true, text:'Multi-usuário (até 10)' },{ ok:true, text:'Automações ilimitadas' },{ ok:true, text:'API access (REST)' },{ ok:true, text:'Relatórios avançados' },{ ok:true, text:'Suporte 24h' },{ ok:true, text:'SLA garantido' }] },
]

const FAQS = [{ q:'Posso cancelar a qualquer momento?', a:'Sim. Cancele quando quiser, sem multas.' },{ q:'A garantia funciona mesmo?', a:'Sim. 14 dias sem perguntas.' },{ q:'Tem desconto anual?', a:'Sim! -33% no plano anual.' },{ q:'Posso trocar de plano?', a:'Pode! Upgrade ou downgrade a qualquer momento.' }]

export default function PlansPage() {
  const { currentPlan, setPlan, showToast } = useStore(s => ({ currentPlan: s.currentPlan, setPlan: s.setPlan, showToast: s.showToast }))
  const [annual, setAnnual] = useState(false)
  const [checkout, setCheckout] = useState<string|null>(null)
  const [faqOpen, setFaqOpen] = useState<number|null>(null)

  function handleSelect(plan: string) {
    if (plan === currentPlan) { showToast('Você já está neste plano!'); return }
    if (plan === 'free') { if (confirm('Fazer downgrade?')) { setPlan('free' as any); showToast('Plano alterado.') }; return }
    setCheckout(plan)
  }
  function activate(plan: string) { setPlan(plan as any); setCheckout(null); showToast(`Plano ${plan} ativado!`) }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}><div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Escolha seu plano</div><div style={{ fontSize: 14, color: 'var(--text2)' }}>Comece grátis. Faça upgrade quando precisar.</div></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}><span style={{ fontSize: 14, color: annual ? 'var(--text2)':'var(--text)', fontWeight: annual ? 400:600 }}>Mensal</span><div onClick={()=>setAnnual(!annual)} style={{ width: 46, height: 26, borderRadius: 99, cursor: 'pointer', position: 'relative', background: annual ? 'var(--accent)':'var(--bg3)', border: '1px solid var(--border2)', transition: 'background 0.2s' }}><div style={{ position: 'absolute', top: 3, left: annual ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div><span style={{ fontSize: 14, color: annual ? 'var(--text)':'var(--text2)', fontWeight: annual ? 600:400 }}>Anual <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,211,160,0.15)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', borderRadius: 99, padding: '2px 8px', marginLeft: 4 }}>-33%</span></span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            return (
              <div key={plan.id} style={{ background: 'var(--bg2)', border: `1px solid ${(plan as any).popular?'rgba(124,109,250,0.5)':isCurrent?'rgba(34,211,160,0.3)':'var(--border)'}`, borderRadius: 'var(--radius)', padding: '24px 22px', position: 'relative', boxShadow: (plan as any).popular?'0 0 40px rgba(124,109,250,0.08)':'none' }}>
                {(plan as any).popular&&(<div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: '0 0 10px 10px', letterSpacing: 0.8 }}>MAIS POPULAR</div>) }
                {isCurrent&&(<div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(34,211,160,0.15)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.25)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✓ ATUAL</div>)}
                <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: plan.color, marginBottom: 6 }}>{plan.label}</div>
                <div style={{ marginBottom: 20 }}><span style={{ fontFamily: 'Syne', fontSize: 34, fontWeight: 900 }}>{plan.monthlyPrice===0?'Grátis':annual?`R$ ${(plan.annualPrice/12).toFixed(2)}`:`R$ ${plan.monthlyPrice.toFixed(2)}`}</span>{plan.monthlyPrice>0&&(<span style={{ fontSize: 13, color: 'var(--text3)' }}>{annual?'/mês (anual)':'/mês'}</span>)}</div>
                <div style={{ marginBottom: 22 }}>{plan.features.map((f,i)=>(<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}><div style={{ width: 18, height: 18, borderRadius: '50%', background: f.ok?'rgba(34,211,160,0.15)':'rgba(107,114,128,0.1)', border: `1px solid ${f.ok?'rgba(34,211,160,0.3)':'rgba(107,114,128,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: f.ok?'var(--green)':'var(--text3)' }}>{&equiv}</div><span style={{ fontSize: 13, color: f.ok?'var(--text)':'var(--text3)' }}>{f.text}</span></div>))}</div>
                <button onClick={()=>handleSelect(plan.id)} style={{ width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: isCurrent?'default':''pointer', border: 'none', transition: 'all 0.2s', background: isCurrent?'rgba(34,211,160,0.15)':plan.id==='pro'?'var(--accent)':plan.id==='business'?'linear-gradient(135deg,#f59e0b,#d97706)':'var(--bg3)', color: isCurrent?'rgba(34,211,160,0.8)':plan.id==='free'?'var(--text2)':'#fff' }}>{isCurrent?'✓ Plano atual':plan.cta}</button>
              </div>
            )
          })}
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto' }}><div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Perguntas frequentes</div>{isPAQS}
        </div>
       </div>
      {checkout&&(<div onClick={e=>e.target===e.currentTarget&&setCheckout(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center''justifyContent:'center',padding:20 }}><div style={{ background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'var(--radius)',padding:'32px 28px',width:'100%',maxWidth:420 }}><div style={{ textAlign:'center',marginBottom:24 }}><div style={{ fontSize:40,marginBottom:8 }}>{checkout==='pro'?'⭐':'🚀'}</div><div style={{ fontFamily:'Syne',fontSize:22,fontWeight:800,marginBottom:4 }}>Plano {PLANS.find(p=>p.id===checkout)?.label}</div><div style={{ fontFamily:'Syne',fontSize:28,fontWeight:800,color:PLANS.find(p=>p.id===checkout)?.color }}>{annual?`R$ ${PLANS.find(p=>p.id===checkout)?.annualPrice}/ano`:`R$ ${PLANS.find(p=>p.id===checkout)?.monthlyPrice.toFixed(2)}/mês`}</div></div><div style={{ background:'rgba(34,211,160,0.07)',border:'1px solid rgba(34,211,160,0.2)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--text2)',lineHeight:1.6 }}>🛡️ Garantia de 14 dias — não gostou? Devolvemos 100%.</div><div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:16 }}><button onClick={()=>activate(checkout)} style={{ padding:'13px 0',borderRadius:10,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>💳 Pagar com cartão</button><button onClick={()=>activate(checkout)} style={{ padding:'13px 0',borderRadius:10,border:'none',background:'#009ee3',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>💙 Mercado Pago</button><button onClick={()=>activate(checkout)} style={{ padding:'13px 0',borderRadius:10,border:'none',background:'linear-gradient(135deg,#32bcad,#1a9488)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer' }}>📱 PIX</button></div><button onClick={()=>setCheckout(null)} style={{ width:'100%',padding:'10px 0',borderRadius:10,background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',fontSize:13,cursor:'pointer' }}>Cancelar</button></div></div>)}
    </AppShell>
  )
}
