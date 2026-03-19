'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { t, type TKey } from '@/lib/translations'
import { AppShell } from '@/components/AppShell'
import { JarvisOverlay } from '@/components/JarvisOverlay'

export default function AgentPage() {
  const { lang, accessToken, userProfile, geminiKey, calendarEvents, addMessage, chatHistory, showToast } = useStore(s => ({
    lang: s.lang, accessToken: s.accessToken, userProfile: s.userProfile,
    geminiKey: s.geminiKey, calendarEvents: s.calendarEvents,
    addMessage: s.addMessage, chatHistory: s.chatHistory, showToast: s.showToast,
  }))

  const [input,       setInput]      = useState('')
  const [loading,     setLoading]    = useState(false)
  const [jarvis,      setJarvis]     = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('Ouvindo...')
  const [transcript,  setTranscript] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, loading])

  const calendarContext = calendarEvents.slice(0, 5).map(ev => `${ev.summary} (${ev.start.dateTime || ev.start.date})`).join(', ')

  async function sendMsg(text: string) {
    if (!text.trim()) return
    setInput('')
    addMessage({ role: 'user', content: text })
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: text }],
          userName: userProfile?.given_name,
          lang,
          calendarContext,
          geminiKey,
        }),
      })
      const data = await res.json()
      if (data.reply) addMessage({ role: 'assistant', content: data.reply })
      else showToast(t(lang, 'err_connect'))
    } catch { showToast(t(lang, 'err_connect')) }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input) }
  }

  // Voice
  const stopVoice = useCallback(() => {
    setJarvis(false)
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} recognitionRef.current = null }
  }, [])

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { showToast(t(lang, 'voice_not_supported')); return }
    const rec = new SR()
    rec.lang = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
    rec.continuous = false
    rec.interimResults = true
    rec.onstart  = () => { setVoiceStatus(t(lang, 'listening')); setTranscript('') }
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setTranscript(txt)
      if (e.results[e.results.length - 1].isFinal) {
        setVoiceStatus(t(lang, 'processing'))
        stopVoice()
        sendMsg(txt)
      }
    }
    rec.onerror  = (e: any) => { stopVoice(); if (e.error !== 'no-speech') showToast('Mic error: ' + e.error) }
    rec.onend    = () => stopVoice()
    recognitionRef.current = rec
    rec.start()
    setJarvis(true)
  }

  function toggleVoice() { jarvis ? stopVoice() : startVoice() }

  // Space bar shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' && e.target instanceof Element && !['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
        e.preventDefault(); toggleVoice()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [jarvis, lang])

  type ChipLang = { pt: string; en: string; es: string }
  const CHIPS: { key: TKey; msg: ChipLang }[] = [
    { key: 'chip_today',        msg: { pt: 'O que tenho na agenda hoje?',              en: "What's on my calendar today?",      es: '¿Qué tengo hoy?' } },
    { key: 'chip_meeting',      msg: { pt: 'Marcar reunião com a equipe na sexta às 15h', en: 'Schedule a team meeting Friday at 3pm', es: 'Reunión equipo viernes 15h' } },
    { key: 'chip_productivity', msg: { pt: 'Me dê dicas para ser mais produtivo hoje', en: 'Tips to be more productive today',    es: 'Consejos productividad hoy' } },
    { key: 'chip_upcoming',     msg: { pt: 'Quais são meus próximos 5 eventos?',       en: 'What are my next 5 events?',         es: '¿Mis próximos 5 eventos?' } },
  ]

  const needsKey = !geminiKey && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* API key notice */}
        {needsKey && (
          <div style={{ padding: '12px 32px', background: 'rgba(124,109,250,0.07)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, marginBottom: 6 }}>🔑 Configure sua chave de IA</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Vá em <b style={{ color: 'var(--accent2)' }}>Configurações → API de IA</b> para ativar respostas inteligentes. Ou defina <code>OPENROUTER_API_KEY</code> no Vercel.</div>
          </div>
        )}

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 32px 0' }}>
          {CHIPS.map(({ key, msg }) => (
            <div key={key} onClick={() => sendMsg(msg[lang] || msg.pt)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t(lang, key)}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatHistory.length === 0 && (
            <div className="msg msg-ai">
              <div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, marginBottom: 5, letterSpacing: 0.5 }}>NEXUS IA</div>
              {t(lang, 'ai_welcome')}
            </div>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-ai'}`}>
              {m.role === 'assistant' && <div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, marginBottom: 5, letterSpacing: 0.5 }}>NEXUS IA</div>}
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
            </div>
          ))}
          {loading && (
            <div className="msg msg-ai" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '14px 16px' }}>
              {[0,0.2,0.4].map((d, i) => <div key={i} className="dot-anim animate-bounce-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text3)', animationDelay: `${d}s` }} />)}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t(lang, 'chat_placeholder')}
            className="input-field"
            style={{ flex: 1, minHeight: 46, maxHeight: 120, borderColor: 'var(--border2)' }}
          />
          <button
            onClick={toggleVoice}
            title="Modo Jarvis — Espaço para falar"
            style={{ width: 46, height: 46, background: 'var(--bg2)', border: `1px solid ${jarvis ? 'var(--red)' : 'var(--border2)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: jarvis ? 'var(--red)' : 'var(--text2)', flexShrink: 0, animation: jarvis ? 'micPulse 1s ease-in-out infinite' : 'none' }}
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <button
            onClick={() => sendMsg(input)}
            disabled={loading || !input.trim()}
            className="send-btn"
            style={{ width: 46, height: 46 }}
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: 6, fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
          Powered by OpenRouter · Gemini · GPT-4 · Espaço = voz
        </div>
      </div>

      <JarvisOverlay visible={jarvis} status={voiceStatus} transcript={transcript} onStop={stopVoice} />
    </AppShell>
  )
}
