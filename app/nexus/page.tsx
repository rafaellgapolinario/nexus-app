'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

interface Msg { id: string; role: 'user'|'nexus'; text: string; time: string; tag?: string }
type S = 'idle'|'listening'|'thinking'|'speaking'

function uid()     { return Math.random().toString(36).slice(2) }
function tstr()    { return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
function cleanTTS(t:string) {
  return t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/#{1,6}\s/g,'').replace(/[📅✅⏰📝💡🔥⚡🎉❌]/g,'').substring(0,350)
}

const WAKE = ['hey nexus','ei nexus','oi nexus','ok nexus']
const COL:Record<S,string> = { idle:'#7c6dfa', listening:'#f87171', thinking:'#f59e0b', speaking:'#22d3a0' }
const LBL:Record<S,string> = { idle:'Aguardando', listening:'Ouvindo...', thinking:'Pensando...', speaking:'Falando...' }

export default function NexusPage() {
  const { lang, userProfile, geminiKey, calendarEvents, accessToken, showToast, addMessage, chatHistory } = useStore(s=>({
    lang:s.lang, userProfile:s.userProfile, geminiKey:s.geminiKey,
    calendarEvents:s.calendarEvents, accessToken:s.accessToken,
    showToast:s.showToast, addMessage:s.addMessage, chatHistory:s.chatHistory,
  }))

  const [s,  setS]   = useState<S>('idle')
  const [msgs, setMsgs] = useState<Msg[]>([{id:uid(),role:'nexus',time:tstr(),
    text:`Olá${userProfile?', '+(userProfile.given_name||userProfile.name):''}! Diga "Hey Nexus" ou pressione Espaço.`}])
  const [live, setLive] = useState('')
  const [input, setInput] = useState('')
  const [continuous, setContinuous] = useState(false)

  const recRef  = useRef<any>(null)
  const wakeRef = useRef<any>(null)
  const audioRef= useRef<HTMLAudioElement|null>(null)
  const sRef    = useRef<S>('idle')
  const lisRef  = useRef(false)
  const coolRef = useRef(false)
  const endRef  = useRef<HTMLDivElement>(null)

  useEffect(()=>{ sRef.current=s },[s])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  // ── Browser TTS ─────────────────────────────────────
  const browserSpeak = useCallback((text:string, onEnd?:()=>void)=>{
    const synth = window.speechSynthesis
    synth.cancel()
    const go = ()=>{
      const u = new SpeechSynthesisUtterance(cleanTTS(text))
      u.lang='pt-BR'; u.rate=1.05; u.pitch=1.1; u.volume=1
      const vs = synth.getVoices()
      const v = vs.find(x=>x.lang.startsWith('pt')&&x.name.toLowerCase().includes('google'))
             || vs.find(x=>x.lang.startsWith('pt')) || vs[0]
      if(v) u.voice=v
      u.onend  = ()=>{ setS('idle'); onEnd?.() }
      u.onerror= ()=>{ setS('idle'); onEnd?.() }
      synth.speak(u)
    }
    const vs = synth.getVoices()
    if(vs.length>0) go()
    else { synth.onvoiceschanged=go }
  },[])

  // ── Speak (ElevenLabs → browser fallback) ───────────
  const speak = useCallback(async (text:string, onEnd?:()=>void)=>{
    setS('speaking')
    try {
      const res = await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:cleanTTS(text)})})
      if(!res.ok) throw new Error('tts fail')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if(audioRef.current){audioRef.current.pause();try{URL.revokeObjectURL(audioRef.current.src)}catch{}}
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = ()=>{ setS('idle'); try{URL.revokeObjectURL(url)}catch{}; onEnd?.() }
      audio.onerror = ()=>{ setS('idle'); try{URL.revokeObjectURL(url)}catch{}; browserSpeak(text,onEnd) }
      await audio.play()
    } catch {
      browserSpeak(text, onEnd)
    }
  },[browserSpeak])

  // ── Save note (client-side call to /api/notes) ───────
  const saveNote = useCallback(async (noteData:any)=>{
    if(!userProfile?.email) return
    try {
      await fetch('/api/notes',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-user-email':userProfile.email},
        body:JSON.stringify({
          tipo: noteData.tipo||'nota',
          titulo: noteData.titulo||null,
          conteudo: noteData.conteudo||'',
          lembrete_em: noteData.lembrete_em||null,
          cor: noteData.tipo==='tarefa'?'#22d3a0':noteData.tipo==='lembrete'?'#f59e0b':'#7c6dfa',
        })
      })
    } catch(e){ console.error('save note:',e) }
  },[userProfile?.email])

  // ── Send to AI ────────────────────────────────────────
  const sendToAI = useCallback(async (text:string)=>{
    if(!text.trim()) return
    setS('thinking'); setLive('')
    setMsgs(p=>[...p,{id:uid(),role:'user',text,time:tstr()}])
    const cal = calendarEvents.slice(0,8).map(e=>`${e.summary} (${e.start.dateTime||e.start.date})`).join(', ')
    try {
      const res = await fetch('/api/chat',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages:[...chatHistory,{role:'user',content:text}],
          userName:userProfile?.given_name||userProfile?.name,
          lang, calendarContext:cal, geminiKey, voiceMode:true,
          userEmail:userProfile?.email, accessToken,
        })
      })
      const data = await res.json()
      const reply = data.reply||'Não consegui processar.'
      let tag=''
      if(data.noteCreated){ tag='📝 Nota salva!'; if(data.noteData) saveNote(data.noteData) }
      if(data.eventCreated) tag='📅 Evento criado!'
      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:reply,time:tstr(),tag}])
      addMessage({role:'user',content:text})
      addMessage({role:'assistant',content:reply})
      if(tag) showToast(tag)
      // After speaking, restart listening if continuous mode
      speak(reply, ()=>{ if(continuous) setTimeout(startListen,600) })
    } catch {
      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:'Erro de conexão.',time:tstr()}])
      speak('Erro de conexão.',()=>{ if(continuous) setTimeout(startListen,600) })
    }
  },[calendarEvents,chatHistory,userProfile,lang,geminiKey,accessToken,speak,addMessage,showToast,saveNote,continuous])

  // ── Stop listening ─────────────────────────────────
  const stopListen = useCallback(()=>{
    lisRef.current=false
    try{recRef.current?.stop()}catch{}
    recRef.current=null
    if(sRef.current==='listening') setS('idle')
    setLive('')
  },[])

  // ── Start listening ─────────────────────────────────
  const startListen = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){showToast('Use Chrome para reconhecimento de voz.');return}
    if(lisRef.current||['thinking','speaking'].includes(sRef.current)) return
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    try{wakeRef.current?.stop()}catch{}; wakeRef.current=null

    setTimeout(()=>{
      if(lisRef.current) return
      const rec=new SR()
      rec.lang='pt-BR'; rec.continuous=false; rec.interimResults=true
      rec.onstart =()=>{ setS('listening'); lisRef.current=true }
      rec.onresult=(e:any)=>{
        const t=Array.from(e.results).map((r:any)=>r[0].transcript).join('')
        let clean=t; WAKE.forEach(w=>{clean=clean.toLowerCase().replace(w,'').trim()})
        setLive(clean||t)
        if(e.results[e.results.length-1].isFinal){
          stopListen()
          const toSend=(clean||t).trim()
          if(toSend.length>1) sendToAI(toSend)
          else if(continuous) setTimeout(startListen,500)
        }
      }
      rec.onerror=(e:any)=>{
        stopListen()
        if(e.error==='not-allowed') showToast('Permita o microfone nas configurações.')
        if(continuous&&e.error!=='not-allowed') setTimeout(startListen,1000)
      }
      rec.onend=()=>{ if(lisRef.current) stopListen() }
      recRef.current=rec
      try{rec.start()}catch{showToast('Erro ao iniciar microfone.')}
    },300)
  },[showToast,stopListen,sendToAI,continuous])

  // ── Wake word ────────────────────────────────────────
  const startWake = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR||lisRef.current||coolRef.current) return
    try{wakeRef.current?.stop()}catch{}
    const rec=new SR()
    rec.lang='pt-BR'; rec.continuous=true; rec.interimResults=true
    rec.onresult=(e:any)=>{
      if(lisRef.current||!['idle'].includes(sRef.current)||coolRef.current) return
      const t=Array.from(e.results).map((r:any)=>r[0].transcript).join('').toLowerCase()
      if(WAKE.some(w=>t.includes(w))){
        coolRef.current=true
        try{rec.stop()}catch{}; wakeRef.current=null
        setTimeout(()=>{ coolRef.current=false; startListen() },500)
      }
    }
    rec.onend  =()=>{ wakeRef.current=null; if(!lisRef.current&&!coolRef.current) setTimeout(startWake,2000) }
    rec.onerror=()=>{ wakeRef.current=null; setTimeout(startWake,3000) }
    wakeRef.current=rec
    try{rec.start()}catch{}
  },[startListen])

  useEffect(()=>{
    const t=setTimeout(startWake,1500)
    return ()=>{
      clearTimeout(t)
      try{wakeRef.current?.stop()}catch{}
      try{recRef.current?.stop()}catch{}
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()
    }
  },[])

  // ── Keyboard: Space=toggle, ESC=stop all ─────────────
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement).tagName
      if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)){
        e.preventDefault()
        if(sRef.current==='idle')      startListen()
        else if(sRef.current==='listening') stopListen()
      }
      if(e.code==='Escape'){
        stopListen()
        audioRef.current?.pause()
        window.speechSynthesis?.cancel()
        setS('idle')
        if(continuous) setContinuous(false)
      }
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[startListen,stopListen,continuous])

  // Restart wake when back to idle (if not continuous)
  useEffect(()=>{
    if(s==='idle'&&!continuous) {
      const t=setTimeout(startWake,1000)
      return ()=>clearTimeout(t)
    }
  },[s,continuous])

  function handleMic(){
    if(s==='speaking'){ audioRef.current?.pause(); window.speechSynthesis?.cancel(); setS('idle'); return }
    if(s==='listening'){ stopListen(); return }
    if(s==='idle') startListen()
  }

  function toggleContinuous(){
    const next=!continuous
    setContinuous(next)
    if(next){ showToast('Modo contínuo ativado. Fale e ESC para sair.'); setTimeout(startListen,400) }
    else     showToast('Modo contínuo desativado.')
  }

  async function handleSend(){
    if(!input.trim()) return
    const t=input.trim(); setInput(''); sendToAI(t)
  }

  const col = COL[s]
  const isActive = s!=='idle'

  return (
    <AppShell>
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',background:'var(--bg)',overflow:'hidden',position:'relative'}}>

        {/* Ambient glow */}
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none',background:`radial-gradient(ellipse 60% 40% at 50% 50%, ${col}11 0%, transparent 70%)`,transition:'background 0.5s',zIndex:0}}/>

        {/* Header */}
        <div style={{padding:'12px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,boxShadow:`0 0 10px ${col}`,animation:isActive?'pulse 1s infinite':'none',transition:'background 0.3s'}}/>
            <span style={{fontFamily:'Syne',fontSize:15,fontWeight:700}}>Nexus · Assistente</span>
            <span style={{fontSize:11,color:'var(--text3)',background:'var(--bg3)',padding:'2px 8px',borderRadius:99,border:'1px solid var(--border)'}}>🎙️ "Hey Nexus"</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={toggleContinuous} style={{fontSize:11,padding:'4px 10px',borderRadius:99,border:`1px solid ${continuous?'var(--green)':'var(--border)'}`,background:continuous?'rgba(34,211,160,0.1)':'transparent',color:continuous?'var(--green)':'var(--text3)',cursor:'pointer',fontWeight:600}}>
              {continuous?'● Contínuo':'○ Contínuo'}
            </button>
            <span style={{fontSize:11,color:col,fontWeight:600,minWidth:90,textAlign:'right'}}>{LBL[s]}</span>
          </div>
        </div>

        {/* HUD orb center — shows when active */}
        {isActive&&(
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',zIndex:0,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            {/* Outer rings */}
            <div style={{position:'relative',width:200,height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {[180,150,120].map((sz,i)=>(
                <div key={i} style={{position:'absolute',width:sz,height:sz,borderRadius:'50%',border:`1px solid ${col}${i===0?'22':i===1?'44':'66'}`,animation:`ring ${1.5+i*0.3}s ease-in-out ${i*0.15}s infinite`}}/>
              ))}
              {/* Core */}
              <div style={{width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle at 40% 40%, ${col}cc, ${col}44)`,boxShadow:`0 0 40px ${col}88, 0 0 80px ${col}44`,display:'flex',alignItems:'center',justifyContent:'center',animation:'corePulse 1.5s ease-in-out infinite'}}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
                  {s==='listening'&&<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></>}
                  {s==='thinking'&&<path d="M21 12a9 9 0 1 1-6.219-8.56"/>}
                  {s==='speaking'&&<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
                </svg>
              </div>
            </div>
            {/* Status label */}
            <div style={{fontSize:13,color:col,fontWeight:600,letterSpacing:2,textTransform:'uppercase',textShadow:`0 0 20px ${col}`}}>{LBL[s]}</div>
            {/* Live transcript */}
            {live&&<div style={{fontSize:14,color:'rgba(255,255,255,0.7)',maxWidth:300,textAlign:'center',fontStyle:'italic'}}>{live}</div>}
          </div>
        )}

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:14,position:'relative',zIndex:1}}>
          {msgs.map(m=>(
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:m.role==='user'?'flex-end':'flex-start',gap:4}}>
              {m.role==='nexus'&&(
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:4}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700}}>N</div>
                  <span style={{fontSize:10,color:'var(--accent2)',fontWeight:700,letterSpacing:1}}>NEXUS</span>
                  <span style={{fontSize:10,color:'var(--text3)'}}>{m.time}</span>
                  {m.tag&&<span style={{fontSize:10,color:'var(--green)',background:'rgba(34,211,160,0.12)',padding:'1px 7px',borderRadius:99,border:'1px solid rgba(34,211,160,0.25)'}}>{m.tag}</span>}
                </div>
              )}
              <div style={{maxWidth:'70%',padding:'12px 16px',fontSize:14,lineHeight:1.65,
                borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:m.role==='user'?`linear-gradient(135deg,#7c6dfa,#a78bfa)`:'var(--bg2)',
                border:m.role==='user'?'none':'1px solid var(--border)',
                backdropFilter:'blur(10px)', color:'var(--text)'}}>
                {m.text}
              </div>
              {m.role==='user'&&<span style={{fontSize:10,color:'var(--text3)',marginRight:4}}>{m.time}</span>}
            </div>
          ))}
          {!isActive&&live&&(
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <div style={{maxWidth:'70%',padding:'10px 16px',borderRadius:'18px 18px 4px 18px',background:'rgba(124,109,250,0.1)',border:'1px dashed rgba(124,109,250,0.4)',color:'var(--text2)',fontSize:13,fontStyle:'italic'}}>{live}...</div>
            </div>
          )}
          {s==='thinking'&&!isActive&&(
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700}}>N</div>
              <div style={{padding:'10px 16px',background:'var(--bg2)',borderRadius:'18px 18px 18px 4px',border:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center'}}>
                {[0,120,240].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--accent2)',animation:`bounce 1s ${d}ms infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Bottom controls */}
        <div style={{flexShrink:0,padding:'14px 24px 20px',borderTop:'1px solid var(--border)',background:'var(--bg)',position:'relative',zIndex:1}}>
          {/* Wave bars */}
          <div style={{height:26,display:'flex',gap:2,alignItems:'center',justifyContent:'center',marginBottom:12,opacity:isActive?1:0,transition:'opacity 0.3s'}}>
            {Array.from({length:24}).map((_,i)=>(
              <div key={i} style={{width:3,borderRadius:99,background:col,boxShadow:`0 0 4px ${col}88`,animation:`wave ${0.35+Math.sin(i)*0.2}s ${i*0.04}s ease-in-out infinite`,transition:'background 0.3s'}}/>
            ))}
          </div>

          <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
            <textarea rows={1} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
              placeholder={continuous?"Modo contínuo ativo — fale ou ESC para sair":"Digite ou use voz... (Enter envia)"}
              style={{flex:1,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:12,padding:'11px 14px',color:'var(--text)',fontSize:14,outline:'none',resize:'none',minHeight:44,maxHeight:100,fontFamily:'DM Sans'}}
            />
            <button onClick={handleMic} style={{
              width:54,height:54,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
              background:`radial-gradient(circle at 35% 35%,${col},${col}88)`,
              boxShadow:isActive?`0 0 0 6px ${col}33,0 0 28px ${col}66`:`0 4px 18px ${col}66`,
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.25s',
              animation:s==='listening'?'micPulse 1.2s ease-in-out infinite':'none',
            }}>
              {s==='speaking'?<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              :s==='thinking'?<div style={{width:20,height:20,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              :<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
            </button>
            <button onClick={handleSend} disabled={!input.trim()} style={{width:42,height:42,borderRadius:10,background:input.trim()?'var(--accent)':'var(--bg3)',border:'1px solid var(--border)',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:input.trim()?1:0.4,transition:'all 0.2s'}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
            {[
              ['📅 Agenda hoje','O que tenho na agenda hoje?'],
              ['📝 Anota','Anota: '],
              ['✅ Tarefa','Cria tarefa: '],
              ['⏰ Lembrete','Me lembra de '],
              ['🧠 Resumo','Resumo da minha semana'],
            ].map(([l,v])=>(
              <button key={l as string}
                onClick={()=>{ if((v as string).endsWith(': ')||(v as string).endsWith('de ')){ setInput(v as string) }else{ sendToAI(v as string) } }}
                style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:99,padding:'4px 12px',fontSize:11,color:'var(--text2)',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=col;e.currentTarget.style.color='var(--accent2)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:8,fontSize:10,color:'var(--text3)'}}>
            <kbd style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'1px 5px'}}>Space</kbd> ativar ·
            <kbd style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:4,padding:'1px 5px',margin:'0 4px'}}>Esc</kbd> parar ·
            Modo contínuo: fala → resposta → fala
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce    { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave      { 0%,100%{height:4px} 50%{height:22px} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes ring      { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.05);opacity:1} }
        @keyframes corePulse { 0%,100%{box-shadow:0 0 40px var(--c,#7c6dfa)88, 0 0 80px var(--c,#7c6dfa)44} 50%{box-shadow:0 0 60px var(--c,#7c6dfa)cc, 0 0 120px var(--c,#7c6dfa)66} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)} 50%{box-shadow:0 0 0 14px rgba(248,113,113,0)} }
      `}</style>
    </AppShell>
  )
}
