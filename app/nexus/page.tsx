'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

interface Msg { id: string; role: 'user'|'nexus'; text: string; time: string; tag?: string }
type S = 'idle'|'listening'|'thinking'|'speaking'

function uid()  { return Math.random().toString(36).slice(2) }
function tstr() { return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
function cleanTTS(t:string) {
  return t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/#{1,6}\s/g,'')
    .replace(/[📅✅⏰📝💡🔥⚡🎉❌🛡️]/g,'').substring(0,350)
}

const COL:Record<S,string> = { idle:'#7c6dfa', listening:'#f87171', thinking:'#f59e0b', speaking:'#22d3a0' }

export default function NexusPage() {
  const { lang, userProfile, geminiKey, calendarEvents, accessToken, showToast, addMessage, chatHistory } = useStore(s=>({
    lang:s.lang, userProfile:s.userProfile, geminiKey:s.geminiKey,
    calendarEvents:s.calendarEvents, accessToken:s.accessToken,
    showToast:s.showToast, addMessage:s.addMessage, chatHistory:s.chatHistory,
  }))

  const [s,     setS]    = useState<S>('idle')
  const [msgs,  setMsgs] = useState<Msg[]>([{id:uid(),role:'nexus',time:tstr(),
    text:`Olá${userProfile?', '+(userProfile.given_name||userProfile.name):''}! Pressione o botão do microfone ou Espaço para falar.`}])
  const [live,  setLive]  = useState('')
  const [input, setInput] = useState('')

  const recRef   = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const sRef     = useRef<S>('idle')
  const lisRef   = useRef(false)
  const endRef   = useRef<HTMLDivElement>(null)

  useEffect(()=>{ sRef.current=s },[s])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  // ── Browser TTS ────────────────────────────────────────
  const browserSpeak = useCallback((text:string, onEnd?:()=>void)=>{
    const synth = window.speechSynthesis
    synth.cancel()
    const go = ()=>{
      const u = new SpeechSynthesisUtterance(cleanTTS(text))
      u.lang='pt-BR'; u.rate=1.0; u.pitch=1.1; u.volume=1
      const vs = synth.getVoices()
      const v = vs.find(x=>x.lang.startsWith('pt')&&x.name.toLowerCase().includes('google'))
             || vs.find(x=>x.lang.startsWith('pt')) || vs[0]
      if(v) u.voice=v
      u.onend  = ()=>{ setS('idle'); onEnd?.() }
      u.onerror= ()=>{ setS('idle'); onEnd?.() }
      synth.speak(u)
    }
    if(window.speechSynthesis.getVoices().length>0) go()
    else { window.speechSynthesis.onvoiceschanged = go }
  },[])

  // ── Speak ──────────────────────────────────────────────
  const speak = useCallback(async (text:string, onEnd?:()=>void)=>{
    setS('speaking')
    try {
      const res = await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:cleanTTS(text)})})
      if(!res.ok) throw new Error('tts')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      if(audioRef.current){audioRef.current.pause();try{URL.revokeObjectURL(audioRef.current.src)}catch{}}
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = ()=>{ setS('idle'); try{URL.revokeObjectURL(url)}catch{}; onEnd?.() }
      audio.onerror = ()=>{ setS('idle'); try{URL.revokeObjectURL(url)}catch{}; browserSpeak(text,onEnd) }
      await audio.play()
    } catch { browserSpeak(text,onEnd) }
  },[browserSpeak])

  // ── Stop mic ───────────────────────────────────────────
  const stopMic = useCallback(()=>{
    lisRef.current = false
    try{ recRef.current?.stop() }catch{}
    recRef.current = null
    if(sRef.current==='listening') setS('idle')
    setLive('')
  },[])

  // ── Start mic — manual trigger only ───────────────────
  const startMic = useCallback(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){ showToast('Use Chrome para reconhecimento de voz.'); return }
    if(lisRef.current) { stopMic(); return } // toggle
    if(['thinking','speaking'].includes(sRef.current)) return

    // Stop audio if playing
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()

    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = ()=>{
      setS('listening')
      lisRef.current = true
      setLive('')
    }

    rec.onresult = (e:any)=>{
      let interim = ''
      let final = ''
      for(let i = e.resultIndex; i < e.results.length; i++){
        const t = e.results[i][0].transcript
        if(e.results[i].isFinal) final += t
        else interim += t
      }
      setLive(interim || final)
      if(final){
        stopMic()
        const text = final.trim()
        if(text.length > 1) sendToAI(text)
      }
    }

    rec.onerror = (e:any)=>{
      stopMic()
      if(e.error === 'not-allowed') showToast('Permita o microfone: clique no cadeado na barra de endereço.')
      else if(e.error !== 'no-speech' && e.error !== 'aborted') showToast('Erro mic: '+e.error)
    }

    rec.onend = ()=>{ if(lisRef.current) stopMic() }

    recRef.current = rec
    try{ rec.start() }catch(e){ showToast('Erro ao iniciar microfone.'); console.error(e) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[showToast, stopMic])

  // ── Send to AI ─────────────────────────────────────────
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

      // Save note if created
      if(data.noteCreated && data.noteData && userProfile?.email){
        tag='📝 Salvo!'
        fetch('/api/notes',{
          method:'POST',
          headers:{'Content-Type':'application/json','x-user-email':userProfile.email},
          body:JSON.stringify({
            tipo: data.noteData.tipo||'nota',
            titulo: data.noteData.titulo||null,
            conteudo: data.noteData.conteudo||text,
            lembrete_em: data.noteData.lembrete_em||null,
            cor: data.noteData.tipo==='tarefa'?'#22d3a0':data.noteData.tipo==='lembrete'?'#f59e0b':'#7c6dfa',
          })
        }).catch(()=>{})
      }
      if(data.eventCreated) tag='📅 Evento criado!'

      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:reply,time:tstr(),tag}])
      addMessage({role:'user',content:text})
      addMessage({role:'assistant',content:reply})
      if(tag) showToast(tag)
      speak(reply)
    } catch {
      setMsgs(p=>[...p,{id:uid(),role:'nexus',text:'Erro de conexão.',time:tstr()}])
      speak('Erro de conexão.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[calendarEvents,chatHistory,userProfile,lang,geminiKey,accessToken,speak,addMessage,showToast])

  // Keyboard shortcuts
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement).tagName
      if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)){
        e.preventDefault()
        startMic()
      }
      if(e.code==='Escape'){
        stopMic()
        audioRef.current?.pause()
        window.speechSynthesis?.cancel()
        setS('idle')
      }
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[startMic,stopMic])

  async function handleSend(){
    if(!input.trim()) return
    const t=input.trim(); setInput(''); sendToAI(t)
  }

  const col = COL[s]
  const isActive = s !== 'idle'
  const statusLabel = {
    idle:      '🎙️ Pronto — pressione Espaço ou o botão',
    listening: '🔴 Ouvindo — fale agora...',
    thinking:  '⚙️ Processando...',
    speaking:  '🔊 Nexus falando...',
  }[s]

  return (
    <AppShell>
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',background:'var(--bg)',overflow:'hidden',position:'relative'}}>

        {/* Ambient glow */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',background:`radial-gradient(ellipse 60% 40% at 50% 50%,${col}0e 0%,transparent 70%)`,transition:'background 0.5s',zIndex:0}}/>

        {/* Header */}
        <div style={{padding:'12px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,zIndex:1,position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:col,boxShadow:`0 0 8px ${col}`,transition:'background 0.3s',animation:isActive?'pulse 1.5s infinite':'none'}}/>
            <span style={{fontFamily:'Syne',fontSize:15,fontWeight:700}}>Nexus · Assistente</span>
          </div>
          <span style={{fontSize:12,color:col,fontWeight:600,transition:'color 0.3s'}}>{statusLabel}</span>
        </div>

        {/* HUD orb — only when active */}
        {isActive&&(
          <div style={{position:'absolute',top:'42%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
            <div style={{position:'relative',width:160,height:160,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {[150,120,92].map((sz,i)=>(
                <div key={i} style={{position:'absolute',width:sz,height:sz,borderRadius:'50%',border:`1.5px solid ${col}${['18','35','66'][i]}`,animation:`ring ${1.3+i*0.25}s ${i*0.12}s ease-in-out infinite`}}/>
              ))}
              <div style={{width:68,height:68,borderRadius:'50%',background:`radial-gradient(circle at 38% 38%,${col}ee,${col}55)`,boxShadow:`0 0 32px ${col}aa,0 0 64px ${col}44`,display:'flex',alignItems:'center',justifyContent:'center',animation:'corePulse 1.8s ease-in-out infinite'}}>
                {s==='listening'&&<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>}
                {s==='thinking'&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/></svg>}
                {s==='speaking'&&<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
              </div>
            </div>
            {live&&(
              <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',maxWidth:300,textAlign:'center',fontStyle:'italic',padding:'6px 16px',background:'rgba(0,0,0,0.4)',borderRadius:99,backdropFilter:'blur(8px)',border:`1px solid ${col}33`}}>
                {live}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:14,zIndex:1,position:'relative'}}>
          {msgs.map(m=>(
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:m.role==='user'?'flex-end':'flex-start',gap:4}}>
              {m.role==='nexus'&&(
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:4}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:800}}>N</div>
                  <span style={{fontSize:10,color:'var(--accent2)',fontWeight:700,letterSpacing:1}}>NEXUS</span>
                  <span style={{fontSize:10,color:'var(--text3)'}}>{m.time}</span>
                  {m.tag&&<span style={{fontSize:10,color:'var(--green)',background:'rgba(34,211,160,0.1)',padding:'1px 8px',borderRadius:99,border:'1px solid rgba(34,211,160,0.2)'}}>{m.tag}</span>}
                </div>
              )}
              <div style={{maxWidth:'70%',padding:'12px 16px',fontSize:14,lineHeight:1.6,
                borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:m.role==='user'?'linear-gradient(135deg,#7c6dfa,#a78bfa)':'var(--bg2)',
                border:m.role==='user'?'none':'1px solid var(--border)',
                color:'var(--text)'}}>
                {m.text}
              </div>
              {m.role==='user'&&<span style={{fontSize:10,color:'var(--text3)',marginRight:4}}>{m.time}</span>}
            </div>
          ))}
          {s==='thinking'&&(
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c6dfa,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:800}}>N</div>
              <div style={{padding:'10px 16px',background:'var(--bg2)',borderRadius:'18px 18px 18px 4px',border:'1px solid var(--border)',display:'flex',gap:4}}>
                {[0,120,240].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--accent2)',animation:`bounce 1s ${d}ms infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Bottom controls */}
        <div style={{flexShrink:0,padding:'12px 24px 18px',borderTop:'1px solid var(--border)',background:'var(--bg)',zIndex:1,position:'relative'}}>
          {/* Wave bars */}
          <div style={{height:24,display:'flex',gap:2,alignItems:'center',justifyContent:'center',marginBottom:10,opacity:isActive?1:0.08,transition:'opacity 0.4s'}}>
            {Array.from({length:22}).map((_,i)=>(
              <div key={i} style={{width:3,borderRadius:99,background:col,animation:isActive?`wave ${0.35+Math.sin(i)*0.18}s ${i*0.04}s ease-in-out infinite`:'none',height:4,transition:'background 0.3s'}}/>
            ))}
          </div>

          <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
            <textarea rows={1} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
              placeholder="Ou digita aqui... (Enter envia)"
              style={{flex:1,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:12,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none',resize:'none',minHeight:42,maxHeight:90,fontFamily:'DM Sans'}}
            />
            {/* Big mic button */}
            <button onClick={startMic} style={{
              width:52,height:52,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
              background:`radial-gradient(circle at 38% 38%,${col},${col}88)`,
              boxShadow:s==='listening'?`0 0 0 6px ${col}44,0 0 28px ${col}88`:`0 4px 16px ${col}66`,
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.25s',
              animation:s==='listening'?'micPulse 1.2s ease-in-out infinite':'none',
            }}>
              {s==='speaking'
                ?<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                :s==='thinking'
                ?<div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                :<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>}
            </button>
            <button onClick={handleSend} disabled={!input.trim()} style={{width:40,height:40,borderRadius:10,background:input.trim()?'var(--accent)':'var(--bg3)',border:'1px solid var(--border)',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:input.trim()?1:0.35,transition:'all 0.2s'}}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Quick chips */}
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            {[
              ['📅 Agenda','O que tenho na agenda hoje?'],
              ['📝 Anota','Anota: '],
              ['✅ Tarefa','Cria tarefa: '],
              ['⏰ Lembrete','Me lembra de '],
              ['🧠 Semana','Resumo da minha semana'],
            ].map(([l,v])=>(
              <button key={l}
                onClick={()=>{ if(v.endsWith(': ')||v.endsWith('de ')){ setInput(v) }else{ sendToAI(v) } }}
                style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:99,padding:'4px 11px',fontSize:11,color:'var(--text2)',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=col;e.currentTarget.style.color='var(--accent2)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:6,fontSize:10,color:'var(--text3)'}}>
            <kbd style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:3,padding:'1px 5px'}}>Espaço</kbd> ativar mic ·
            <kbd style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:3,padding:'1px 5px',margin:'0 3px'}}>Esc</kbd> parar
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce    { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave      { 0%,100%{height:4px} 50%{height:20px} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes ring      { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.06);opacity:1} }
        @keyframes corePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.5)} 50%{box-shadow:0 0 0 14px rgba(248,113,113,0)} }
      `}</style>
    </AppShell>
  )
}
