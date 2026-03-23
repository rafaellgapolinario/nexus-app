'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

interface Msg { id: string; role: 'user' | 'nexus'; text: string; time: string }
type JState = 'idle' | 'listening' | 'thinking' | 'speaking'

function uid() { return Math.random().toString(36).slice(2) }
function nowStr() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function cleanTTS(t: string) {
  return t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/#{1,6}\s/g,'')
    .replace(/[⚡🤖📅💬⏰☀️📊🔥💡🎉🛡️⭐🚀💳🧠⚙️🔒✅❌📋🗓🎙️]/g,'').substring(0,400)
}

const STATE_CFG = {
  idle:      { color: '#7c6dfa', glow: 'rgba(124,109,250,0.4)', label: 'Diga "Hey Nexus" ou pressione Espaço' },
  listening: { color: '#f87171', glow: 'rgba(248,113,113,0.5)', label: 'Ouvindo...' },
  thinking:  { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  label: 'Pensando...' },
  speaking:  { color: '#22d3a0', glow: 'rgba(34,211,160,0.5)',  label: 'Nexus falando...' },
}

const WAKE = ['hey nexus','ei nexus','oi nexus','ok nexus']
const wakeTriggeredRef = { current: false }
const wakeCooldownRef  = { current: false }

export default function NexusVoicePage() {
  const { lang, userProfile, geminiKey, calendarEvents, showToast, addMessage, chatHistory } = useStore(s => ({
    lang: s.lang, userProfile: s.userProfile, geminiKey: s.geminiKey,
    calendarEvents: s.calendarEvents, showToast: s.showToast,
    addMessage: s.addMessage, chatHistory: s.chatHistory,
  }))

  const [jState,    setJState]   = useState<JState>('idle')
  const [messages,  setMessages] = useState<Msg[]>([{
    id: uid(), role: 'nexus', time: nowStr(),
    text: `Olá${userProfile ? ', ' + (userProfile.given_name || userProfile.name) : ''}! Sou o Nexus. Diga "Hey Nexus" ou pressione Espaço para começar.`,
  }])
  const [transcript, setTranscript] = useState('')
  const [inputText,  setInputText]  = useState('')
  const [useEleven,  setUseEleven]  = useState(true) // ElevenLabs TTS

  const recRef     = useRef<any>(null)
  const wakeRef    = useRef<any>(null)
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const listeningR = useRef(false)
  const jStateRef  = useRef<JState>('idle')
  const endRef     = useRef<HTMLDivElement>(null)

  useEffect(() => { jStateRef.current = jState }, [jState])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── ElevenLabs TTS ───────────────────────────────────────
  const speakElevenLabs = useCallback(async (text: string) => {
    setJState('speaking')
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanTTS(text) }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setJState('idle'); URL.revokeObjectURL(url); setTimeout(restartWake, 500) }
      audio.onerror = () => { setJState('idle'); fallbackTTS(text) }
      await audio.play()
    } catch {
      fallbackTTS(text)
    }
  }, [])

  // ── Fallback browser TTS ─────────────────────────────────
  const fallbackTTS = useCallback((text: string) => {
    setJState('speaking')
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(cleanTTS(text))
    u.lang  = lang === 'en' ? 'en-US' : 'pt-BR'
    u.rate  = 1.0; u.pitch = 1.1; u.volume = 0.95
    const voices = synth.getVoices()
    const v = voices.find(x => x.lang.startsWith(lang === 'en' ? 'en' : 'pt') && x.name.toLowerCase().includes('google'))
      || voices.find(x => x.lang.startsWith(lang === 'en' ? 'en' : 'pt'))
    if (v) u.voice = v
    u.onend = () => { setJState('idle'); setTimeout(restartWake, 500) }
    u.onerror = () => setJState('idle')
    synth.speak(u)
  }, [lang])

  const speak = useCallback((text: string) => {
    if (useEleven) speakElevenLabs(text)
    else fallbackTTS(text)
  }, [useEleven, speakElevenLabs, fallbackTTS])

  // ── AI Call ──────────────────────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) return
    setJState('thinking'); setTranscript('')
    setMessages(prev => [...prev, { id: uid(), role: 'user', text, time: nowStr() }])
    const calCtx = calendarEvents.slice(0,5).map(ev => `${ev.summary} (${ev.start.dateTime||ev.start.date})`).join(', ')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: text }],
          userName: userProfile?.given_name || userProfile?.name,
          lang, calendarContext: calCtx, geminiKey, voiceMode: true,
          userEmail: userProfile?.email,
        }),
      })
      const data = await res.json()
      const reply = data.reply || 'Não consegui processar isso agora.'
      setMessages(prev => [...prev, { id: uid(), role: 'nexus', text: reply, time: nowStr() }])
      addMessage({ role: 'user', content: text })
      addMessage({ role: 'assistant', content: reply })
      if (data.noteCreated) showToast('📝 Anotação salva!')
      speak(reply)
    } catch {
      const err = 'Erro de conexão. Tente novamente.'
      setMessages(prev => [...prev, { id: uid(), role: 'nexus', text: err, time: nowStr() }])
      speak(err)
    }
  }, [calendarEvents, chatHistory, userProfile, lang, geminiKey, speak, addMessage])

  // ── Stop Listening ───────────────────────────────────────
  const stopListening = useCallback(() => {
    listeningR.current = false
    if (recRef.current) { try { recRef.current.stop() } catch {} recRef.current = null }
    if (jStateRef.current === 'listening') setJState('idle')
    setTranscript('')
  }, [])

  // ── Start Listening ──────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { showToast('Use Chrome para voz.'); return }
    if (audioRef.current) { audioRef.current.pause() }
    window.speechSynthesis?.cancel()
    if (wakeRef.current) { try { wakeRef.current.stop() } catch {} wakeRef.current = null }

    // Small delay to let wake word audio clear from mic buffer
    setTimeout(() => {
      const rec = new SR()
      rec.lang = lang === 'en' ? 'en-US' : 'pt-BR'
      rec.continuous = false; rec.interimResults = true
      rec.onstart  = () => { setJState('listening'); listeningR.current = true }
      rec.onresult = (e: any) => {
        const raw = Array.from(e.results).map((r: any) => r[0].transcript).join('')
        // Remove wake word from transcript so it doesn't get sent to AI
        let clean = raw
        WAKE.forEach(w => { clean = clean.toLowerCase().replace(w, '').trim() })
        const display = clean || raw
        setTranscript(display)
        if (e.results[e.results.length-1].isFinal) {
          stopListening()
          const toSend = display.trim()
          if (toSend.length > 1) sendToAI(toSend)
        }
      }
      rec.onerror = (e: any) => {
        stopListening()
        if (e.error !== 'no-speech' && e.error !== 'aborted') showToast('Mic: ' + e.error)
      }
      rec.onend = () => { if (listeningR.current) stopListening() }
      recRef.current = rec
      try { rec.start() } catch { showToast('Erro ao iniciar microfone.') }
    }, 400)
  }, [lang, sendToAI, showToast, stopListening])

  // ── Wake Word ────────────────────────────────────────────
  const restartWake = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR || listeningR.current || wakeCooldownRef.current) return
    const rec = new SR()
    rec.lang = lang === 'en' ? 'en-US' : 'pt-BR'
    rec.continuous = true; rec.interimResults = true
    rec.onresult = (e: any) => {
      if (listeningR.current || jStateRef.current !== 'idle' || wakeCooldownRef.current) return
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('').toLowerCase().trim()
      if (WAKE.some(p => t.includes(p))) {
        // Set cooldown to prevent double trigger
        wakeCooldownRef.current = true
        wakeTriggeredRef.current = true
        try { rec.stop() } catch {} wakeRef.current = null
        setTimeout(() => {
          wakeCooldownRef.current = false
          wakeTriggeredRef.current = false
          if (!listeningR.current) startListening()
        }, 600)
      }
    }
    rec.onend   = () => {
      wakeRef.current = null
      if (!listeningR.current && !wakeCooldownRef.current) {
        setTimeout(restartWake, 2000)
      }
    }
    rec.onerror = () => { wakeRef.current = null; setTimeout(restartWake, 3000) }
    wakeRef.current = rec
    try { rec.start() } catch {}
  }, [lang, startListening])

  useEffect(() => {
    const t = setTimeout(() => restartWake(), 1500)
    return () => {
      clearTimeout(t)
      if (wakeRef.current)  { try { wakeRef.current.stop()  } catch {} }
      if (recRef.current)   { try { recRef.current.stop()   } catch {} }
      if (audioRef.current) { audioRef.current.pause() }
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── Keyboard ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(tag)) {
        e.preventDefault()
        if (jStateRef.current === 'listening') stopListening()
        else if (jStateRef.current === 'idle') startListening()
      }
      if (e.code === 'Escape') {
        stopListening()
        audioRef.current?.pause()
        window.speechSynthesis?.cancel()
        setJState('idle')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startListening, stopListening])

  function handleMicBtn() {
    if (jState === 'speaking')  { audioRef.current?.pause(); window.speechSynthesis?.cancel(); setJState('idle'); return }
    if (jState === 'listening') { stopListening(); return }
    if (jState === 'idle')      startListening()
  }

  async function handleSend() {
    if (!inputText.trim()) return
    const t = inputText.trim(); setInputText(''); await sendToAI(t)
  }

  const cfg = STATE_CFG[jState]

  return (
    <AppShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.color, boxShadow:`0 0 10px ${cfg.glow}`, animation:jState!=='idle'?'pulse 1s infinite':'none' }} />
            <span style={{ fontFamily:'Syne', fontSize:15, fontWeight:700 }}>Nexus · Assistente</span>
            <span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg3)', padding:'2px 8px', borderRadius:99, border:'1px solid var(--border)' }}>🎙️ "Hey Nexus"</span>
            {/* ElevenLabs toggle */}
            <div onClick={() => setUseEleven(!useEleven)} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:11, color: useEleven ? 'var(--green)' : 'var(--text3)', background:'var(--bg3)', padding:'2px 8px', borderRadius:99, border:`1px solid ${useEleven ? 'rgba(34,211,160,0.3)' : 'var(--border)'}` }}>
              {useEleven ? '🔊 ElevenLabs' : '🔊 Browser TTS'}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, fontSize:11, color:'var(--text3)' }}>
            <span style={{ color:cfg.color, fontWeight:600 }}>{cfg.label}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:14 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems:msg.role==='user'?'flex-end':'flex-start', gap:4 }}>
              {msg.role==='nexus' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:4 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#7c6dfa,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="11" height="11" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="8" fill="white"/><line x1="36" y1="28" x2="36" y2="10" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="36" y1="44" x2="36" y2="62" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="28" y1="36" x2="10" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="44" y1="36" x2="62" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize:10, color:'var(--accent2)', fontWeight:600, letterSpacing:1 }}>NEXUS</span>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>{msg.time}</span>
                </div>
              )}
              <div style={{
                maxWidth:'70%', padding:'12px 18px', fontSize:14, lineHeight:1.65,
                borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:msg.role==='user'?'linear-gradient(135deg,#7c6dfa,#a78bfa)':'var(--bg2)',
                border:msg.role==='user'?'none':'1px solid var(--border)',
                boxShadow:msg.role==='user'?'0 4px 20px rgba(124,109,250,0.25)':'none',
                color:'var(--text)',
              }}>
                {msg.text}
              </div>
              {msg.role==='user' && <span style={{ fontSize:10, color:'var(--text3)', marginRight:4 }}>{msg.time}</span>}
            </div>
          ))}

          {transcript && (
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ maxWidth:'70%', padding:'12px 18px', borderRadius:'18px 18px 4px 18px', background:'rgba(124,109,250,0.1)', border:'1px dashed rgba(124,109,250,0.35)', color:'var(--text2)', fontSize:14, fontStyle:'italic' }}>
                {transcript}...
              </div>
            </div>
          )}

          {jState==='thinking' && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#7c6dfa,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="11" height="11" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="8" fill="white"/><line x1="36" y1="28" x2="36" y2="10" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="36" y1="44" x2="36" y2="62" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="28" y1="36" x2="10" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/><line x1="44" y1="36" x2="62" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ padding:'12px 18px', background:'var(--bg2)', borderRadius:'18px 18px 18px 4px', border:'1px solid var(--border)', display:'flex', gap:5, alignItems:'center' }}>
                {[0,150,300].map((d,i) => <div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent2)',animation:`bounce 1.2s ${d}ms infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Bottom controls */}
        <div style={{ flexShrink:0, padding:'16px 24px 20px', borderTop:'1px solid var(--border)', background:'var(--bg)' }}>
          {/* Waves */}
          <div style={{ height:32, display:'flex', gap:3, alignItems:'center', justifyContent:'center', marginBottom:12, opacity:jState!=='idle'?1:0, transition:'opacity 0.3s' }}>
            {Array.from({length:20}).map((_,i) => (
              <div key={i} style={{ width:3, borderRadius:99, background:cfg.color, boxShadow:`0 0 4px ${cfg.glow}`, animation:`wave ${0.35+Math.sin(i)*0.2}s ${i*0.05}s ease-in-out infinite` }} />
            ))}
          </div>

          {/* Input row */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <textarea rows={1} value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }}
              placeholder="Ou digita aqui... (Enter para enviar)"
              style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:14, padding:'12px 16px', color:'var(--text)', fontSize:14, outline:'none', resize:'none', minHeight:46, maxHeight:100, fontFamily:'DM Sans' }}
            />
            <button onClick={handleMicBtn} style={{
              width:58, height:58, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0,
              background:`radial-gradient(circle at 35% 35%, ${cfg.color}, ${cfg.color}99)`,
              boxShadow:jState!=='idle'?`0 0 0 8px ${cfg.glow},0 0 32px ${cfg.glow}`:`0 4px 20px ${cfg.glow}`,
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s',
              animation:jState==='listening'?'micPulse 1.2s ease-in-out infinite':'none',
            }}>
              {jState==='speaking' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              ) : jState==='thinking' ? (
                <div style={{ width:22, height:22, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            <button onClick={handleSend} disabled={!inputText.trim()} style={{ width:46, height:46, borderRadius:12, background:inputText.trim()?'var(--accent)':'var(--bg3)', border:'1px solid var(--border)', cursor:inputText.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity:inputText.trim()?1:0.4 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Quick commands */}
          <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
            {[
              ['📅 Agenda hoje',      'O que tenho na agenda hoje?'],
              ['➕ Novo evento',       'Quero criar um novo evento'],
              ['💬 Avisar equipe',     'Manda mensagem no WhatsApp pra equipe'],
              ['⚡ Produtividade',    'Como posso ser mais produtivo hoje?'],
              ['🧠 Resumo da semana', 'Me dá um resumo do que tenho essa semana'],
              ['💰 Finanças',         'Me ajuda a organizar minhas finanças'],
            ].map(([label, msg]) => (
              <button key={label as string} onClick={() => sendToAI(msg as string)}
                style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:99, padding:'5px 12px', fontSize:11, color:'var(--text2)', cursor:'pointer', fontFamily:'DM Sans', transition:'all 0.15s' }}
                onMouseEnter={e=>{(e.currentTarget.style.borderColor='var(--accent)');(e.currentTarget.style.color='var(--accent2)')}}
                onMouseLeave={e=>{(e.currentTarget.style.borderColor='var(--border)');(e.currentTarget.style.color='var(--text2)')}}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce   { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes wave     { 0%,100%{height:4px} 50%{height:24px} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes micPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.5),0 4px 20px rgba(248,113,113,0.4)}
          50%{box-shadow:0 0 0 14px rgba(248,113,113,0),0 4px 20px rgba(248,113,113,0.4)}
        }
      `}</style>
    </AppShell>
  )
}
