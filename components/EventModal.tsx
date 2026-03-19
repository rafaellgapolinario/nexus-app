'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { t } from '@/lib/translations'

interface Props { onClose: () => void; onCreated: () => void }

export function EventModal({ onClose, onCreated }: Props) {
  const { lang, accessToken, showToast } = useStore(s => ({ lang: s.lang, accessToken: s.accessToken, showToast: s.showToast }))
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

  const [title, setTitle] = useState('')
  const [start, setStart] = useState(fmt(now))
  const [end,   setEnd]   = useState(fmt(new Date(now.getTime() + 3600000)))
  const [loc,   setLoc]   = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!title || !start || !end) { showToast(t(lang, 'fill_fields')); return }
    setLoading(true)
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start, end, location: loc }),
    })
    setLoading(false)
    if (res.ok) { showToast(t(lang, 'event_created')); onCreated(); onClose() }
    else showToast(t(lang, 'err_event'))
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 480, border: '1px solid var(--border2)' }}>
        <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{t(lang, 'modal_newevent')}</h3>
        <div className="input-wrap" style={{ marginBottom: 10 }}>
          <input className="input-field" placeholder="Título do evento" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input className="input-field" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} style={{ colorScheme: 'dark' }} />
          <input className="input-field" type="datetime-local" value={end}   onChange={e => setEnd(e.target.value)}   style={{ colorScheme: 'dark' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input className="input-field" placeholder="Local (opcional)" value={loc} onChange={e => setLoc(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={create} disabled={loading}>
          {loading ? 'Criando...' : t(lang, 'btn_create_event')}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, padding: 12, cursor: 'pointer', marginTop: 4 }}>
          {t(lang, 'btn_cancel')}
        </button>
      </div>
    </div>
  )
}
