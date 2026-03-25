'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

interface Msg { id: string; role: 'user'|'nexus'; text: string; time: string; tag?: string }
type State = 'idle'|'listening'|'thinking'|'speaking'

function uid()    { return Math.random().toString(36).slice(2) }
function timeStr(){ return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
function cleanSpeak(t:string){ return t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/#{1,6}\s/g,'').replace(/[📅✅⏰📝💡🔥⚡🎉]/g,'').substring(0,350) }

const COLORS:Record<State,string> = {
  idle:'#7c6dfa', listening:'#f87171', thinking:'#f59e0b', speaking:'#22d3a0'
}
const WAKE = ['hey nexus','ei nexus','oi nexus','ok nexus']

export default function NexusPage() {
  const { lang, userProfile, geminiKey, calendarEvents, accessToken, showToast, addMessage, chatHistory } = useStore(s=>({
    lang:s.lang, userProfile:s.userProfile, geminiKey:s.geminiKey,
    calendarEvents:s.calendarEvents, accessToken:s.accessToken,
    showToast:s.showToast, addMessage:s.addMessage, chatHistory:s.chatHistory,
  }))

  const [state,    setState]   = useState<State>('idle')
  const [msgs,     setMsgs]    = useState<Msg[]>([{id:uid(),role:'nexus',time:timeStr(),
    text:`Olá${userProfile?', '+(userProfile.given_name||userProfile.name):''}! Diga "Hey Nexus" ou pressione Espaço.`}])
  const [live,     setLive]    = useState('')
  const [input,    setInput]   = useState('')

  const recRef   = useRef<any>(null)
  const wakeRef  = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const synthRef = useRef<SpeechSynthesis|null>(null)
  const isListen = useRef(false)
  const stateRef = useRef<State>('idle')
  const cooldown = useRef(false)
  const endRef   = useRef<HTMLDivElement>(null)

  useEffect(()=>{ stateRef.current=state },[state])
  useEffect(()=>{ if(typeof window!=='undefined') synthRef.current=window.speechSynthesis },[])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  // ── Speak ─────────────────────────────────────────────
  const speak = useCallback(async (text:string) => {
    setState('speaking')
    // Try ElevenLabs first
    if (process.env.NEXT_PUBLIC_USE_ELEVENLABS !== 'false') {
      try {
        const res = await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:cleanSpeak(text)})})
        if (res.ok) {
          const blob = await res.blob()
          const url  = URL.createObjectURL(blob)
          if(audioRef.current){audioRef.current.pause();URL.revokeObjectURL(audioRef.current.src)}
          const audio = new Audio(url)
          audioRef.current = audio
          audio.onended = ()=>{ setState('idle'); URL.revokeObjectURL(url); setTimeout(startWake,800) }
          audio.onerror = ()=>{ setState('idle'); browserSpeak(text) }
          await audio.play(); return
        }
      } catch {}
    }
    browserSpeak(text)
  },[])

  const browserSpeak = useCallback((text:string)=>{
    setState('speaking')
    const synth = synthRef.current; if(!synth){setState('idle');return}
    synth.cancel()
    const u = new SpeechSynthesisUtterance(cleanSpeak(text))
    u.lang  = lang==='en'?'en-US':'pt-BR'; u.rate=1.05; u.pitch=1; u.volume=0.95
    const v = synth.getVoices().find(x=>x.lang.startsWith(lang==='en'?'en':'pt')&&x.name.toLowerCase().includes('google'))
           || synth.getVoices().find(x=>x.lang.startsWith(lang==='en'?'en':'pt'))
    if(v) u.voice=v
    u.onend  = ()=>{ setState('idle'); setTimeout(startWake,800) }
    u.onerror= ()=>  setState('idle')
    synth.speak(u)
  },[lang])

  // ── Send to AI ────────────────────────────────────────
  const sendToAI = useCallback(async (text:string)=>{
    if(!text.trim()) return
    setState('thinking'); setLive('')
    setMsgs(p=>[...p,{id:uid(),role:'user',text,time:timeStr()}])
    const cal = calendarEvents.slice(0,8).map(e=>`${e.summary} (${e.start.dateTime||e.start.date})`).join(', ')
    try {
      const res = await fetch('/api/chat',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[...chatHistory,{role:'user',content:text}],
          userName: userProfile?.given_name||userProfile?.name,
          lang, calendarContext:cal, geminiKey, voiceMode:true,
          userEmail: userProfile?.email,
          accessToken,
        })
      })
      const data = await res.json()
      const reply = data.reply||'Não consegui processar.'
      let tag = ''
      if(data.noteCreated)  tag='📝 Nota salva!'
      if(data.eventCreated) tag='📅 Evento criado!'
      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:reply,time:timeStr(),tag}])
      addMessage({role:'user',content:text})
      addMessage({role:'assistant',content:reply})
      if(tag) showToast(tag)
      speak(reply)
    } catch {
      const err='Erro de conexão.'
      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:err,time:timeStr()}])
      speak(err)
    }
  },[calendarEvents,chatHistory,userProfile,lang,geminiKey,accessToken,speak,addMessage,showToast])

  // ── Stop listening ────────────────────────────────────
  const stopListen = useCallback(()=>{
    isListen.current=false
    try{recRef.current?.stop()}catch{}
    recRef.current=null
    if(stateRef.current==='listening') setState('idle')
    setLive('')
  },[])

  // ── Start listening ───────────────────────────────────
  const startListen = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){showToast('Use Chrome para reconhecimento de voz.');return}
    if(isListen.current||stateRef.current!=='idle') return
    audioRef.current?.pause()
    synthRef.current?.cancel()
    try{wakeRef.current?.stop()}catch{}
    wakeRef.current=null

    setTimeout(()=>{
      const rec=new SR()
      rec.lang=lang==='en'?'en-US':'pt-BR'
      rec.continuous=false; rec.interimResults=true
      rec.onstart =()=>{ setState('listening'); isListen.current=true }
      rec.onresult=(e:any)=>{
        const t=Array.from(e.results).map((r:any)=>r[0].transcript).join('')
        // Remove wake word from transcript
        let clean=t
        WAKE.forEach(w=>{clean=clean.toLowerCase().replace(w,'').trim()})
        setLive(clean||t)
        if(e.results[e.results.length-1].isFinal){
          stopListen()
          const toSend=(clean||t).trim()
          if(toSend.length>1) sendToAI(toSend)
        }
      }
      rec.onerror=(e:any)=>{
        stopListen()
        if(e.error==='not-allowed') showToast('Permita o microfone nas configurações.')
        else if(e.error!=='no-speech'&&e.error!=='aborted') showToast('Erro mic: '+e.error)
      }
      rec.onend=()=>{ if(isListen.current) stopListen() }
      recRef.current=rec
      try{rec.start()}catch{showToast('Erro ao iniciar microfone.')}
    },350)
  },[lang,sendToAI,showToast,stopListen])

  // ── Wake word ─────────────────────────────────────────
  const startWake = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR||isListen.current||cooldown.current) return
    try{wakeRef.current?.stop()}catch{}
    const rec=new SR()
    rec.lang=lang==='en'?'en-US':'pt-BR'
    rec.continuous=true; rec.interimResults=true
    rec.onresult=(e:any)=>{
      if(isListen.current||stateRef.current!=='idle'||cooldown.current) return
      const t=Array.from(e.results).map((r:any)=>r[0].transcript).join('').toLowerCase()
      if(WAKE.some(w=>t.includes(w))){
        cooldown.current=true
        try{rec.stop()}catch{}
        wakeRef.current=null
        setTimeout(()=>{
          cooldown.current=false
          startListen()
        },500)
      }
    }
    rec.onend=()=>{ wakeRef.current=null; if(!isListen.current&&!cooldown.current) setTimeout(startWake,2000) }
    rec.onerror=()=>{ wakeRef.current=null; setTimeout(startWake,3000) }
    wakeRef.current=rec
    try{rec.start()}catch{}
  },[lang,startListen])

  useEffect(()=>{
    const t=setTimeout(startWake,1500)
    return ()=>{
      clearTimeout(t)
      try{wakeRef.current?.stop()}catch{}
      try{recRef.current?.stop()}catch{}
      audioRef.current?.pause()
      synthRef.current?.cancel()
    }
  },[])

  // ── Keyboard ──────────────────────────────────────────
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement).tagName
      if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)){
        e.preventDefault()
        if(stateRef.current==='idle')      startListen()
        else if(stateRef.current==='listening') stopListen()
      }
      if(e.code==='Escape'){
        stopListen()
        audioRef.current?.pause()
        synthRef.current?.cancel()
        setState('idle')
      }
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[startListen,stopListen])

  function handleMic(){
    if(state==='speaking'){ audioRef.current?.pause(); synthRef.current?.cancel(); setState('idle'); setTimeout(startWake,500); return }
    if(state==='listening'){ stopListen(); return }
    if(state==='idle') startListen()
  }

  async function handleSend(){
    if(!input.trim()) return
    const t=input.trim(); setInput(''); await sendToAI(t)
  }

  const col = COLORS[state]

  return (
    <AppShell>
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',background:'var(--bg)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'12px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,boxShadow:`0 0 8px ${col}`,animation:state!=='idle'?'pulse 1s infinite':'none'}}/>
            <span style={{fontFamily:'Syne',fontSize:15,fontWeight:700}}>Nexus · Assistente</span>
            <span style={{fontSize:11,color:'var(--text3)',background:'var(--bg3)',padding:'2px 8px',borderRadius:99,border:'1px solid var(--border)'}}>🎙️ "Hey Nexus"</span>
          </div>
          <div style={{fontSize:11,color:col,fontWeight:600}}>
            {state==='idle'&&'Aguardando...'}
            {state==='listening'&&'🔴 Ouvindo...'}
            {state==='thinking'&&'⚙️ Pensando...'}
            {state==='speaking'&&'🔊 Falando...'}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:14}}>
          {msgs.map(m=>(
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:m.role==='user'?'flex-end':'flex-start',gap:4}}>
              {m.role==='nexus'&&(
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:4}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:700}}>N</div>
                  <span style={{fontSize:10,color:'var(--accent2)',fontWeight:700,letterSpacing:1}}>NEXUS</span>
                  <span style={{fontSize:10,color:'var(--text3)'}}>{m.time}</span>
                  {m.tag&&<span style={{fontSize:10,color:'var(--green)',background:'rgba(34,211,160,0.1)',padding:'1px 6px',borderRadius:99,border:'1px solid rgba(34,211,160,0.2)'}}>{m.tag}</span>}
                </div>
              )}
              <div style={{maxWidth:'72%',padding:'12px 16px',fontSize:14,lineHeight:1.65,
                borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:m.role==='user'?'linear-gradient(135deg,#7c6dfa,#a78bfa)':'var(--bg2)',
                border:m.role==='user'?'none':'1px solid var(--border)',
                color:'var(--text)'}}>
                {m.text}
              </div>
              {m.role==='user'&&<span style={{fontSize:10,color:'var(--text3)',marginRight:4}}>{m.time}</span>}
            </div>
          ))}
          {live&&(
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <div style={{maxWidth:'72%',padding:'10px 16px',borderRadius:'18px 18px 4px 18px',background:'rgba(124,109,250,0.1)',border:'1px dashed rgba(124,109,250,0.4)',color:'var(--text2)',fontSize:13,fontStyle:'italic'}}>{live}...</div>
            </div>
          )}
          {state==='thinking'&&(
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:700}}>N</div>
              <div style={{padding:'10px 16px',background:'var(--bg2)',borderRadius:'18px 18px 18px 4px',border:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center'}}>
                {[0,120,240].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--accent2)',animation:`bounce 1s ${d}ms infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Controls */}
        <div style={{flexShrink:0,padding:'14px 24px 20px',borderTop:'1px solid var(--border)',background:'var(--bg)'}}>
          {/* Waves */}
          <div style={{height:28,display:'flex',gap:2,alignItems:'center',justifyContent:'center',marginBottom:12,opacity:state!=='idle'?1:0,transition:'opacity 0.3s'}}>
            {Array.from({length:22}).map((_,i)=>(
              <div key={i} style={{width:3,borderRadius:99,background:col,animation:`wave ${0.4+Math.sin(i)*0.15}s ${i*0.04}s ease-in-out infinite`}}/>
            ))}
          </div>
          {/* Input */}
          <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
            <textarea rows={1} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
              placeholder="Digite ou use voz... (Enter envia)"
              style={{flex:1,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:12,padding:'11px 14px',color:'var(--text)',fontSize:14,outline:'none',resize:'none',minHeight:44,maxHeight:100,fontFamily:'DM Sans'}}
            />
            <button onClick={handleMic} style={{
              width:52,height:52,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
              background:`radial-gradient(circle at 35% 35%,${col},${col}99)`,
              boxShadow:state!=='idle'?`0 0 0 6px ${col}33,0 0 24px ${col}66`:`0 4px 16px ${col}66`,
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.25s',
              animation:state==='listening'?'micPulse 1.2s ease-in-out infinite':'none',
            }}>
              {state==='speaking'?<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              :state==='thinking'?<div style={{width:20,height:20,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              :<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
            </button>
            <button onClick={handleSend} disabled={!input.trim()} style={{width:42,height:42,borderRadius:10,background:input.trim()?'var(--accent)':'var(--bg3)',border:'1px solid var(--border)',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:input.trim()?1:0.4}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          {/* Quick */}
          <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
            {[
              ['📅 Agenda hoje','O que tenho na agenda hoje?'],
              ['📝 Anota ideia','Anota: '],
              ['✅ Cria tarefa','Cria tarefa: '],
              ['⏰ Lembrete','Me lembra de '],
              ['🧠 Resumo','Me dá um resumo da minha semana'],
            ].map(([l,v])=>(
              <button key={l as string} onClick={()=>{ if((v as string).endsWith(': ')||v==='Me lembra de '){ setInput(v as string) }else{ sendToAI(v as string) } }}
                style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:99,padding:'4px 12px',fontSize:11,color:'var(--text2)',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent2)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes wave{0%,100%{height:4px}50%{height:22px}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)}50%{box-shadow:0 0 0 12px rgba(248,113,113,0)}}
      `}</style>
    </AppShell>
  )
}
