'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

type NoteType = 'nota' | 'tarefa' | 'lembrete'
interface Note {
  id: string; tipo: NoteType; titulo?: string; conteudo: string
  concluido: boolean; lembrete_em?: string; cor: string; criado_em: string
}

const TYPE_CFG = {
  nota:     { icon: '📝', label: 'Nota',      color: '#7c6dfa' },
  tarefa:   { icon: '✅', label: 'Tarefa',    color: '#22d3a0' },
  lembrete: { icon: '⏰', label: 'Lembrete',  color: '#f59e0b' },
}

export default function NotesPage() {
  const { userProfile, showToast } = useStore(s => ({ userProfile: s.userProfile, showToast: s.showToast }))
  const [notes,    setNotes]    = useState<Note[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | NoteType>('all')
  const [showForm, setShowForm] = useState(false)
  const [aiInput,  setAiInput]  = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Form state
  const [tipo,       setTipo]       = useState<NoteType>('nota')
  const [titulo,     setTitulo]     = useState('')
  const [conteudo,   setConteudo]   = useState('')
  const [lembrete,   setLembrete]   = useState('')
  const [editId,     setEditId]     = useState<string | null>(null)

  const headers = { 'Content-Type': 'application/json', 'x-user-email': userProfile?.email || '' }

  const load = useCallback(async () => {
    if (!userProfile?.email) return
    setLoading(true)
    try {
      const res = await fetch('/api/notes', { headers })
      const data = await res.json()
      setNotes(data.notes || [])
    } catch { showToast('Erro ao carregar anotações.') }
    setLoading(false)
  }, [userProfile?.email])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!conteudo.trim()) { showToast('Escreva algo primeiro.'); return }
    try {
      if (editId) {
        await fetch('/api/notes', { method: 'PATCH', headers, body: JSON.stringify({ id: editId, tipo, titulo, conteudo, lembrete_em: lembrete || null, cor: TYPE_CFG[tipo].color }) })
        showToast('✅ Atualizado!')
      } else {
        await fetch('/api/notes', { method: 'POST', headers, body: JSON.stringify({ tipo, titulo, conteudo, lembrete_em: lembrete || null, cor: TYPE_CFG[tipo].color }) })
        showToast('✅ Salvo!')
      }
      reset(); load()
    } catch { showToast('Erro ao salvar.') }
  }

  async function toggle(note: Note) {
    await fetch('/api/notes', { method: 'PATCH', headers, body: JSON.stringify({ id: note.id, concluido: !note.concluido }) })
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, concluido: !n.concluido } : n))
  }

  async function del(id: string) {
    if (!confirm('Excluir esta anotação?')) return
    await fetch('/api/notes', { method: 'DELETE', headers, body: JSON.stringify({ id }) })
    setNotes(prev => prev.filter(n => n.id !== id))
    showToast('Excluído.')
  }

  function edit(note: Note) {
    setEditId(note.id); setTipo(note.tipo); setTitulo(note.titulo || '')
    setConteudo(note.conteudo); setLembrete(note.lembrete_em?.slice(0,16) || '')
    setShowForm(true); window.scrollTo(0, 0)
  }

  function reset() {
    setEditId(null); setTipo('nota'); setTitulo(''); setConteudo(''); setLembrete(''); setShowForm(false)
  }

  // AI create note
  async function aiCreateNote() {
    if (!aiInput.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Crie uma anotação a partir disso: "${aiInput}". Responda APENAS com JSON neste formato: {"tipo":"nota|tarefa|lembrete","titulo":"título curto","conteudo":"conteúdo completo","lembrete_em":"2026-03-23T15:00 ou null"}` }],
          userName: userProfile?.given_name, lang: 'pt',
        })
      })
      const data = await res.json()
      const clean = data.reply.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      await fetch('/api/notes', {
        method: 'POST', headers,
        body: JSON.stringify({ ...parsed, cor: TYPE_CFG[parsed.tipo as NoteType]?.color || '#7c6dfa' })
      })
      showToast('✅ IA criou a anotação!')
      setAiInput(''); load()
    } catch { showToast('IA não conseguiu criar. Tente manualmente.') }
    setAiLoading(false)
  }

  const filtered = filter === 'all' ? notes : notes.filter(n => n.tipo === filter)
  const inp: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }

  return (
    <AppShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>📝 Anotações</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{notes.length} anotações · Notas, tarefas e lembretes</div>
          </div>
          <button onClick={() => { reset(); setShowForm(!showForm) }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? '✕ Cancelar' : '➕ Nova'}
          </button>
        </div>

        {/* AI Quick Add */}
        <div style={{ background: 'linear-gradient(135deg,rgba(124,109,250,0.08),rgba(124,109,250,0.03))', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600, marginBottom: 8 }}>⚡ Criar com IA</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} placeholder='Ex: "lembrar de pagar o cartão dia 10" ou "tarefa: enviar relatório amanhã"'
              value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aiCreateNote()} />
            <button onClick={aiCreateNote} disabled={aiLoading || !aiInput.trim()} style={{ background: aiLoading ? 'var(--bg3)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              {aiLoading ? '⏳' : '✨ Criar'}
            </button>
          </div>
        </div>

        {/* Manual Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              {editId ? '✏️ Editar' : '➕ Nova anotação'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(Object.keys(TYPE_CFG) as NoteType[]).map(t => (
                <button key={t} onClick={() => setTipo(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', border: `1px solid ${tipo === t ? TYPE_CFG[t].color : 'var(--border)'}`, background: tipo === t ? `${TYPE_CFG[t].color}22` : 'transparent', color: tipo === t ? TYPE_CFG[t].color : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {TYPE_CFG[t].icon} {TYPE_CFG[t].label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inp} placeholder="Título (opcional)" value={titulo} onChange={e => setTitulo(e.target.value)} />
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'DM Sans' }} placeholder="Conteúdo *" value={conteudo} onChange={e => setConteudo(e.target.value)} />
              {tipo === 'lembrete' && (
                <input type="datetime-local" style={inp} value={lembrete} onChange={e => setLembrete(e.target.value)} />
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={reset} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={save} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {editId ? 'Salvar alterações' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['all', '📋 Todas'], ['nota', '📝 Notas'], ['tarefa', '✅ Tarefas'], ['lembrete', '⏰ Lembretes']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as any)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${filter === v ? 'var(--accent)' : 'var(--border)'}`, background: filter === v ? 'rgba(124,109,250,0.12)' : 'transparent', color: filter === v ? 'var(--accent2)' : 'var(--text2)' }}>
              {l}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>{filtered.length} itens</span>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Carregando...</div>
        ) : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div>Nenhuma anotação ainda.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Use a IA ou o botão "Nova" para criar.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(note => {
              const cfg = TYPE_CFG[note.tipo]
              return (
                <div key={note.id} style={{ background: 'var(--bg2)', border: `1px solid ${note.concluido ? 'var(--border)' : cfg.color + '44'}`, borderRadius: 'var(--radius)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, opacity: note.concluido ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  {/* Top */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: 1, textTransform: 'uppercase' }}>{cfg.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>{new Date(note.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {/* Content */}
                  {note.titulo && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: note.concluido ? 'line-through' : 'none' }}>{note.titulo}</div>}
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, textDecoration: note.concluido ? 'line-through' : 'none', flex: 1 }}>{note.conteudo}</div>
                  {note.lembrete_em && (
                    <div style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      ⏰ {new Date(note.lembrete_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {note.tipo === 'tarefa' && (
                      <button onClick={() => toggle(note)} style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, border: `1px solid ${note.concluido ? 'var(--border)' : 'var(--green)'}`, background: note.concluido ? 'transparent' : 'rgba(34,211,160,0.1)', color: note.concluido ? 'var(--text3)' : 'var(--green)', cursor: 'pointer', fontWeight: 600 }}>
                        {note.concluido ? '↩ Reabrir' : '✓ Concluir'}
                      </button>
                    )}
                    <button onClick={() => edit(note)} style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>✏️ Editar</button>
                    <button onClick={() => del(note.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: 'var(--red)', cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
