'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { t, type TKey } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { JarvisOverlay, speakText, useSpeechRecognition } from '@/components/JarvisOverlay'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Intent = 'chat' | 'note' | 'habit' | 'finance' | 'event'

interface ApiResponse {
  reply: string
  type?: Intent
  data?: Record<string, unknown>
  audioBase64?: string
  text?: string
}

interface Chip { label: string; msg: { pt: string; en: string; es: string } }
const CHIPS_TKEY: { key: TKey; msg: { pt: string; en: string; es: string } }[] = [
  { key: 'chip_today', msg: { pt: 'O que tenho na agenda hoje?', en: "What's on my calendar today?", es: '¿Qué tengo hoy?' } },
  { key: 'chip_meeting', msg: { pt: 'Marcar reunião com equipe sexta às 15h', en: 'Schedule team meeting Friday 3pm', es: 'Reunión equipo viernes 15h' } },
  { key: 'chip_productivity', msg: { pt: 'Dicas para ser mais produtivo hoje', en: 'Tips to be more productive today', es: 'Consejos productividad hoy' } },
  { key: 'chip_upcoming', msg: { pt: 'Meus próximos 5 eventos', en: 'My next 5 events', es: 'Mis próximos 5 eventos' } },
]
const CHIPS_EXTRA: Chip[] = [
  { label: '🎯 Criar habito', msg: { pt: 'Quero criar hábito de meditar 10min', en: 'Create habit: meditate 10min', es: 'H\u00e1bito: meditar 10min' } },
  { label: 'П�� Registrar gasto', msg: { pt: 'Gastei R$45 no almo\u00e7o hoje', en: 'I spent $45 on lunch today', es: 'Gast\u00e9 $45 en almuerzo hoy' } },
]

export default function AgentPage() {
  const {
    lang, accessToken, userProfile, geminiKey,
    calendarEvents, addMessage, chatHistory, showToast,
  } = useStore(s => ({
    lang: s.lang, accessToken: s.accessToken, userProfile: s.userProfile,
    geminiKey: s.geminiKey, calendarEvents: s.calendarEvents,
    addMessage: s.addMessage, chatHistory: s.chatHistory,}� showToast: s.showToast,
  }))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [jarvis, setJarvis] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('Ouvindo...')
  const [transcript, setTranscript] = useState('')
  const [ttsEnabled] = useState(() => !!process.env.NEXT_PUBLIC_AZURE_TTS_ENABLED)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speakingRef = useRef(false)
  const calendarContext = calendarEvents.slice(0, 5).map(ev => `${ev.summary} (${ev.start.dateTime || ev.start.date})`).join(', ')
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, loading, streaming])
  const sendMsg = useCallback(async (text: string, fromVoice = false) => {
    if (!text.trim()) return
    setInput('')
    addMessage({ role: 'user', content: text })
    setLoading(true)
    setStreaming('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatHistory, { role: 'user', content: text }], userName: userProfile?.given_name, lang, calendarContext, geminiKey, accessToken, voiceMode: fromVoice, ttsEnabled: fromVoice && ttsEnabled }),
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('text/event-stream')) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const l of decoder.decode(value).split('\n')) {
            if (l.startsWith('data: ')) { try { const { text: tx } = JSON.parse(l.slice(6)); if (tx) { full += tx; setStreaming(full) } } catch {} }
          }
        }
        addMessage({ role: 'assistant', content: full })
        setStreaming('')
        if (fromVoice && !speakingRef.current) { speakingRef.current = true; await speakText(full, ttsEnabled); speakingRef.current = false }
      } else {
        const data: ApiResponse = await res.json()
        if (data.reply) {
          addMessage({ role: 'assistant', content: data.reply })
          if (fromVoice && !speakingRef.current) { speakingRef.current = true; await speakText(data.reply, ttsEnabled); speakingRef.current = false }
        } else { showToast(t(lang, 'err_connect')) }
      }
    } catch { showToast(t(lang, 'err_connect')) }
    setLoading(false)
  }, [chatHistory, lang, calendarContext, geminiKey, accessToken, ttsEnabled, userProfile, addMessage, showToast])
  const { start: startRec, stop: stopRec } = useSpeechRecognition({ lang, onFinal: useCallback((tx: string) => { setTranscript(tx); setVoiceStatus('Processando...'); setJarvis(false); stopRec(); sendMsg(tx, true) }, [sendMsg, stopRec]), onInterim: useCallback((tx: string) => setTranscript(tx), []), onError: useCallback((err: string) => { if (err === 'not_supported') showToast('Microfone n\u00e3o suportado neste navegador'); setJarvis(false) }, [showToast]) })
  const stopVoice = useCallback(() => { setJarvis(false); stopRec(); setTranscript(''); setVoiceStatus('Ouvindo...') }, [stopRec])
  function toggleVoice() { if (jarvis) { stopVoice(); return }; setTranscript(''); setVoiceStatus('Ouvindo...'); setJarvis(true); startRec() }
  useEffect(() => { function onKey(e: KeyboardEvent) { if (e.code === 'Space' && e.target instanceof Element && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) { e.preventDefault(); toggleVoice() } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [jarvis])
  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) } }
  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flewWrap: 'wrap', gap: 7, padding: '14px 32px 0' }}>
          {CHIPS_TKEY.map(({ key, msg }) => (<div key={key} onClick={() => sendMsg(msg[lang] || msg.pt)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>{t(lang, key)}</div>))}
          {CHIPS_EXTRA.map(({ label, msg }) => (<div key={label} onClick={() => sendMsg(msg[lang] || msg.pt)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>{label}</div>))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatHistory.length === 0 && (<div className="msg msg-ai"><div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, marginBottom: 5, letterSpacing: 0.5 }}>NEXUS IA</div>{t(lang, 'ai_welcome')}</div>)}
          {chatHistory.map((m: any, i: number) => (<div key={i} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-ai'}`}>{mrole === 'assistant' && <div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>NEXUS IA</div>}<div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>') }} /></div>))}
          {streaming && (<div className="msg msg-ai"><div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, marginBottom: 5, letterSpacing: 0.5 }}>NEXUS IA</div><div dangerouslySetInnerHTML={{ __html: streaming.replace(/\n/g, '<br>') }} /><span style={{ opacity: 0.4, animation: 'blink 1s infinite' }}>▊</span></div>) }
          {loading && !streaming && (<div className="msg msg-ai" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '14px 16px' }}>{[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text3)', animationDelay: `${d}s` }} />)}</div>) }
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={t(lang, 'chat_placeholder')} className="input-field" style={{ flex: 1, minHeight: 46, maxHeight: 120, borderColor: 'var(--border2)' }} />
          <button onClick={toggleVoice} title="Modo Jarvis" style={{ width: 46, height: 46, background: jarvis ? 'rgba(124,109,250,0.15)' : 'var(--bg2)', border: `1px solid ${jarvis ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: jarvis ? 'var(--accent)' : 'var(--text2)', flexShrink: 0, animation: jarvis ? 'micPulse 1s ease-in-out infinite' : 'none', transition: 'all 0.2s' }}><svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg></button>
          <button onClick={() => sendMsg(input)} disabled={loading || !input.trim()} className="send-btn" style={{ width: 46, height: 46 }}><svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></button>
        </div>
        <div style={{ textAlign: 'center', padding: 6, fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{ttsEnabled ? 'Voz: Azure Neural · ' : ''}Powered by OpenRouter · Gemini </div>
      </div>
      <JarvisOverlay visible={jarvis} status={voiceStatus} transcript={transcript} onStop={stopVoice} />
    </AppShell>
  )
}
