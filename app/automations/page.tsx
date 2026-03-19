'use client'
import { useStore, getPlanAccess } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import { PlanGateModal } from '@/components/PlanGateModal'
import { useState } from 'react'
import type { AutomationConfig } from '@/lib/types'

const RULES: { key: keyof AutomationConfig; icon: string; title: string; sub: string; color: string }[] = [
  { key: 'auto_event_whatsapp', icon: '💬', title: 'Criar evento → Avisar no WhatsApp',       sub: 'Ao criar um evento, envia aviso automático para usuários cadastrados', color: 'rgba(37,211,102,0.12)' },
  { key: 'auto_reminder_1h',    icon: '⏰', title: 'Evento em 1h → Lembrete WhatsApp',         sub: 'Envia lembrete 1 hora antes de cada evento',                        color: 'rgba(124,109,250,0.12)' },
  { key: 'auto_reminder_24h',   icon: '📅', title: 'Evento amanhã → Aviso preparatório',       sub: 'Todo dia às 18h avisa sobre eventos do dia seguinte',               color: 'rgba(124,109,250,0.12)' },
  { key: 'auto_free_slot',      icon: '🧠', title: 'Manhã livre → Bloquear horário de foco',  sub: 'Se não houver reuniões até 10h, cria bloco 09h–11h30',              color: 'rgba(34,211,160,0.12)' },
  { key: 'auto_overdue_notify', icon: '🚨', title: 'Tarefa atrasada → Notificação urgente',   sub: 'Envia alerta quando uma tarefa passa do prazo',                     color: 'rgba(248,113,113,0.12)' },
  { key: 'auto_daily_summary',  icon: '☀️', title: 'Todo dia às 08h → Resumo diário',         sub: 'Envia agenda do dia para todos os usuários cadastrados',            color: 'rgba(245,158,11,0.12)' },
  { key: 'auto_weekly_report',  icon: '📊', title: 'Toda sexta → Relatório de produtividade', sub: 'Envia resumo da semana via WhatsApp toda sexta às 17h',             color: 'rgba(124,109,250,0.12)' },
  { key: 'auto_ai_suggestions', icon: '🤖', title: 'Sugestões automáticas da IA',             sub: 'A IA analisa sua agenda e sugere ações ao abrir o app',             color: 'rgba(124,109,250,0.15)' },
  { key: 'auto_burnout_alert',  icon: '🔥', title: 'Alerta de sobrecarga (burnout)',           sub: 'Avisa quando há mais de 5 reuniões em um dia',                     color: 'rgba(248,113,113,0.12)' },
]

const SECTIONS = [
  { title: 'Agenda & Calendário',    keys: ['auto_event_whatsapp','auto_reminder_1h','auto_reminder_24h','auto_free_slot'] },
  { title: 'Tarefas & Produtividade',keys: ['auto_overdue_notify','auto_daily_summary','auto_weekly_report'] },
  { title: 'IA Proativa',            keys: ['auto_ai_suggestions','auto_burnout_alert'] },
]

export default function AutomationsPage() {
  const { automations, toggleAutomation, currentPlan, userProfile, showToast } = useStore(s => ({
    automations: s.automations, toggleAutomation: s.toggleAutomation,
    currentPlan: s.currentPlan, userProfile: s.userProfile, showToast: s.showToast,
  }))
  const [planGate, setPlanGate] = useState(false)
  const hasAccess = getPlanAccess('automations', currentPlan, userProfile?.email)
  const activeCount = Object.values(automations).filter(Boolean).length

  function toggle(key: keyof AutomationConfig) {
    if (!hasAccess) { setPlanGate(true); return }
    toggleAutomation(key)
    showToast(automations[key] ? 'Automação pausada.' : '✅ Automação ativada!')
  }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {/* Header */}
        <div style={{ background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Automações ativas</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Regras que o Nexus executa automaticamente por você</div>
            </div>
          </div>
          <div style={{ background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>{activeCount}</div>
        </div>

        {!hasAccess && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--amber)' }}>
            🔒 Automações disponíveis nos planos <b>Pro</b> e <b>Business</b>. <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setPlanGate(true)}>Fazer upgrade →</span>
          </div>
        )}

        {SECTIONS.map(sec => (
          <div key={sec.title}>
            <div className="sec">{sec.title}</div>
            <div className="card">
              {sec.keys.map((k, i) => {
                const rule = RULES.find(r => r.key === k)!
                const isOn = automations[k as keyof AutomationConfig]
                return (
                  <div key={k}>
                    <div className="auto-rule">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div className="auto-rule-icon" style={{ background: rule.color }}>{rule.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{rule.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>{rule.sub}</div>
                        </div>
                      </div>
                      <div className={`toggle ${isOn ? 'on' : ''}`} onClick={() => toggle(k as keyof AutomationConfig)} />
                    </div>
                    {i < sec.keys.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {planGate && <PlanGateModal feature="automations" onClose={() => setPlanGate(false)} />}
    </AppShell>
  )
}
