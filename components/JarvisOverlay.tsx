'use client'
import { useRef, useCallback, useState } from 'react'
import { NexusIcon } from './NexusIcon'

interface Props {
  visible: boolean
  status: string
  transcript: string
  onStop: () => void
}

export async function speakText(text: string, ttsEnabled: boolean): Promise<void> {
  if (!text) return
  if (ttsEnabled) {
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (res.ok) {
        const { audioBase64 } = await res.json()
        if (audioBase64) {
          const binary = atob(audioBase64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: 'audio/mp3' })
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          return new Promise(resolve => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve() }
            audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
            audio.play().catch(() => resolve())
          })
        }
      }
    } catch {}
  }
  return new Promise(resolve => {
    if (!window.speechSynthesis) return resolve()
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'pt-BR'
    utt.rate = 1.05
    utt.pitch = 0.95
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt') && v.name.toLowerCase().includes('google')) || voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utt.voice = ptVoice
    utt.onend = () => resolve()
    utt.onerror = () => resolve()
    window.speechSynthesis.speak(utt)
  })
}

export function useSpeechRecognition(opts: { lang: string; onFinal: (t: string) => void; onInterim?: (t: string) => void; onError?: (e: string) => void }) {
  const recRef = useRef<any>(null)
  const restartRef = useRef(false)
  const silenceTimer = useRef<ReturnType<typeof setTimeout>>()

  const stop = useCallback(() => {
    restartRef.current = false
    clearTimeout(silenceTimer.current)
    try { recRef.current?.stop() } catch {}
    recRef.current = null
  }, [])

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { opts.onError?.('not_supported'); return }
    restartRef.current = true
    const rec = new SR()
    rec.lang = opts.lang === 'en' ? 'en-US' : opts.lang === 'es' ? 'es-ES' : 'pt-BR'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      clearTimeout(silenceTimer.current)
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t; else interim += t
      }
      if (interim) opts.onInterim?.(interim)
      if (final) { opts.onFinal(final.trim()); silenceTimer.current = setTimeout(stop, 1500) }
    }
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') { if (restartRef.current) { try { rec.stop() } catch {} }; return }
      opts.onError?.(e.error)
      stop()
    }
    rec.onend = () => { if (restartRef.current) { try { recRef.current?.start() } catch {} } }
    recRef.current = rec
    try { rec.start() } catch (err) { opts.onError?.('start_failed') }
  }, [opts.lang])

  return { start, stop }
}

export function JarvisOverlay({ visible, status, transcript, onStop }: Props) {
  const [bars] = useState([6, 14, 24, 32, 24, 14, 6])
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 4, color: 'var(--accent2)', textTransform: 'uppercase', opacity: 0.6 }}>NEXUS · JARVIS MODE</div>
      <div style={{ width: 130, height: 130, borderRadius: '50%', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'jarvisSpin 4s linear infinite' }}>
        {[{ s: -10, op: 0.3, d: '2s', r: 'reverse' }, { s: -20, op: 0.15, d: '6s', r: 'normal' }].map((r, i) => (
          <div key={i} style={{ position: 'absolute', inset: r.s, borderRadius: '50%', border: `1px ${i===1?'dashed':'solid'} rgba(124,109,250,${r.op})`, animation: `jarvisSpin ${r.d} linear infinite ${r.r}` }} />
        ))}
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,109,250,0.25) 0%,rgba(124,109,250,0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'jarvisPulse 1.8s ease-in-out infinite' }}>
          <NexusIcon size={34} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ width: 4, height: h, borderRadius: 99, background: 'var(--accent2)', animation: `wave 0.9s ease-in-out ${i * 0.1}s infinite` }} />
        ))}
      </div>
      <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, textAlign: 'center', maxWidth: 320 }}>{status}</div>
      {transcript && (<div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', maxWidth: 340, fontStyle: 'italic', background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.15)', borderRadius: 12, padding: '10px 16px' }}>"{transcript}"</div>)}
      <button onClick={onStop} style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 99, padding: '10px 28px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>✕ Parar</button>
    </div>
  )
}
