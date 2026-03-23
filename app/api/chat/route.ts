import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/db'

export const runtime = 'nodejs'

interface Message { role: 'user' | 'assistant'; content: string }

// ── Detect intent from message ─────────────────────────────
function detectIntent(text: string) {
  const t = text.toLowerCase()
  if (/(anota|registra|salva|guarda|cria (uma |a )?(nota|tarefa|lembrete)|me lembra|lembrete|não esquecer|não esquece|preciso fazer|tenho que fazer)/i.test(t)) return 'save_note'
  if (/(cria (um |o )?evento|agenda|marca (uma |a )?(reunião|consulta|compromisso)|adiciona (ao|na) calendário|adiciona (um |o )?evento)/i.test(t)) return 'create_event'
  return 'chat'
}

async function callAI(messages: Message[], system: string, geminiKey?: string): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nexus-app-inky-beta.vercel.app',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 400, temperature: 0.2,
      }),
    })
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
    const d = await res.json()
    return d.choices[0].message.content
  }
  const key = geminiKey || process.env.GEMINI_API_KEY
  if (key) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: system }] }, ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))],
          generationConfig: { maxOutputTokens: 400, temperature: 0.2 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const d = await res.json()
    return d.candidates[0].content.parts[0].text
  }
  throw new Error('No AI key configured')
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userName, lang, calendarContext, geminiKey, voiceMode, userEmail, accessToken } = await req.json()
    const lastMsg = messages[messages.length - 1]?.content || ''
    const intent  = detectIntent(lastMsg)

    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const calInfo = calendarContext
      ? `AGENDA REAL DO USUÁRIO:\n${calendarContext}\nNUNCA invente eventos. Só fale de eventos listados acima.`
      : 'AGENDA: Não carregada. Peça para sincronizar o Google Calendar.'

    const voiceRule = voiceMode
      ? 'MODO VOZ: Responda em NO MÁXIMO 2 frases curtas. Sem markdown, sem listas, sem emojis.'
      : 'Seja direto. Use markdown apenas quando necessário.'

    // ── SAVE NOTE intent ──────────────────────────────────
    if (intent === 'save_note' && userEmail) {
      const extractSystem = `Extraia uma anotação da mensagem do usuário. Responda SOMENTE com JSON válido, sem texto extra, sem markdown:
{"tipo":"nota|tarefa|lembrete","titulo":"título curto (max 50 chars)","conteudo":"conteúdo completo","lembrete_em":"YYYY-MM-DDTHH:mm:ss ou null"}
Data atual: ${now}`

      let saved = false
      let noteReply = ''

      try {
        const raw = await callAI([{ role: 'user', content: lastMsg }], extractSystem, geminiKey)
        const clean = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        if (userEmail) {
          const user = await getUserByEmail(userEmail)
          if (user) {
            const colorMap: Record<string, string> = { nota: '#7c6dfa', tarefa: '#22d3a0', lembrete: '#f59e0b' }
            await supabaseAdmin.from('notes').insert({
              user_id: user.id,
              tipo: parsed.tipo || 'nota',
              titulo: parsed.titulo || null,
              conteudo: parsed.conteudo || lastMsg,
              lembrete_em: parsed.lembrete_em || null,
              cor: colorMap[parsed.tipo] || '#7c6dfa',
            })
            saved = true
            const typeLabel = parsed.tipo === 'tarefa' ? 'tarefa' : parsed.tipo === 'lembrete' ? 'lembrete' : 'nota'
            noteReply = voiceMode
              ? `${typeLabel === 'nota' ? 'Anotado' : typeLabel === 'tarefa' ? 'Tarefa criada' : 'Lembrete criado'}: ${parsed.titulo || parsed.conteudo?.substring(0, 40)}`
              : `✅ **${typeLabel === 'nota' ? 'Nota salva' : typeLabel === 'tarefa' ? 'Tarefa criada' : 'Lembrete criado'}!**\n\n**${parsed.titulo || 'Sem título'}**\n${parsed.conteudo}${parsed.lembrete_em ? `\n\n⏰ Lembrete: ${new Date(parsed.lembrete_em).toLocaleString('pt-BR')}` : ''}`
          }
        }
      } catch (e) {
        console.error('Note parse error:', e)
      }

      if (saved) return NextResponse.json({ reply: noteReply, noteCreated: true })
    }

    // ── CREATE EVENT intent ───────────────────────────────
    if (intent === 'create_event' && accessToken) {
      const extractSystem = `Extraia os detalhes do evento da mensagem. Responda SOMENTE com JSON válido:
{"summary":"título do evento","start":"YYYY-MM-DDTHH:mm:ss","end":"YYYY-MM-DDTHH:mm:ss","description":"descrição ou null"}
Data atual: ${now}. Se não souber o horário de fim, adicione 1 hora ao início.`

      try {
        const raw = await callAI([{ role: 'user', content: lastMsg }], extractSystem, geminiKey)
        const clean = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        const gcalRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: parsed.summary,
            description: parsed.description,
            start: { dateTime: parsed.start, timeZone: 'America/Sao_Paulo' },
            end:   { dateTime: parsed.end,   timeZone: 'America/Sao_Paulo' },
          }),
        })

        if (gcalRes.ok) {
          const event = await gcalRes.json()
          const reply = voiceMode
            ? `Evento criado: ${parsed.summary}`
            : `✅ **Evento criado no Google Calendar!**\n\n📅 **${parsed.summary}**\n⏰ ${new Date(parsed.start).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}`
          return NextResponse.json({ reply, eventCreated: true, eventId: event.id })
        }
      } catch (e) {
        console.error('Event create error:', e)
      }
    }

    // ── NORMAL CHAT ───────────────────────────────────────
    const system = `Você é Nexus, assistente pessoal de ${userName || 'usuário'}.
Responda APENAS em ${lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português brasileiro'}.
Data atual: ${now}
${voiceRule}
IMPORTANTE: Você NÃO pode criar eventos ou anotações diretamente neste modo. Se o usuário pedir para criar algo, diga que não conseguiu processar e oriente a tentar novamente com mais detalhes.
${calInfo}`

    const reply = await callAI(messages, system, geminiKey)
    return NextResponse.json({ reply })

  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Erro ao conectar com a IA. Tente novamente.' })
  }
}
