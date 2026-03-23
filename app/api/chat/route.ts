import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface Message { role: 'user' | 'assistant'; content: string }

function detectIntent(text: string) {
  const t = text.toLowerCase()
  if (/(anota|registra|salva|guarda|cria (uma |a )?(nota|tarefa|lembrete)|me lembra|lembrete|não esquecer|preciso fazer|tenho que fazer)/i.test(t)) return 'save_note'
  if (/(cria (um |o )?evento|coloca na agenda|quero agendar|marca (uma |a )?(reunião|consulta|compromisso)|adiciona.*calendário)/i.test(t)) return 'create_event'
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
          contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          systemInstruction: { parts: [{ text: system }] },
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
      ? `AGENDA REAL:\n${calendarContext}\nNUNCA invente eventos. Use APENAS os dados acima.`
      : 'AGENDA: Não carregada. Oriente sincronizar o Google Calendar.'

    const voiceRule = voiceMode
      ? 'MODO VOZ: Máximo 2 frases curtas. Sem markdown, sem listas, sem emojis.'
      : 'Seja direto. Use markdown apenas quando necessário.'

    // ── SAVE NOTE via separate API call ──────────────────
    if (intent === 'save_note' && userEmail) {
      const extractSystem = `Extraia uma anotação da mensagem. Responda SOMENTE com JSON válido:
{"tipo":"nota|tarefa|lembrete","titulo":"título curto max 50 chars","conteudo":"conteúdo completo","lembrete_em":"YYYY-MM-DDTHH:mm:ss ou null"}
Data atual: ${now}`
      try {
        const raw    = await callAI([{ role: 'user', content: lastMsg }], extractSystem, geminiKey)
        const clean  = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        // Save via internal API (nodejs route)
        const saveRes = await fetch(`${req.nextUrl.origin}/api/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({
            tipo:        parsed.tipo || 'nota',
            titulo:      parsed.titulo || null,
            conteudo:    parsed.conteudo || lastMsg,
            lembrete_em: parsed.lembrete_em || null,
            cor: parsed.tipo === 'tarefa' ? '#22d3a0' : parsed.tipo === 'lembrete' ? '#f59e0b' : '#7c6dfa',
          }),
        })
        if (saveRes.ok) {
          const typeLabel = parsed.tipo === 'tarefa' ? 'Tarefa criada' : parsed.tipo === 'lembrete' ? 'Lembrete criado' : 'Anotado'
          const reply = voiceMode
            ? `${typeLabel}: ${parsed.titulo || parsed.conteudo?.substring(0, 40)}`
            : `✅ **${typeLabel}!**\n\n**${parsed.titulo || 'Sem título'}**\n${parsed.conteudo}${parsed.lembrete_em ? `\n\n⏰ ${new Date(parsed.lembrete_em).toLocaleString('pt-BR')}` : ''}`
          return NextResponse.json({ reply, noteCreated: true })
        }
      } catch (e) {
        console.error('Note save error:', e)
      }
    }

    // ── CREATE EVENT ──────────────────────────────────────
    if (intent === 'create_event' && accessToken) {
      const extractSystem = `Extraia os detalhes do evento. Responda SOMENTE com JSON válido:
{"summary":"título","start":"YYYY-MM-DDTHH:mm:ss","end":"YYYY-MM-DDTHH:mm:ss","description":"ou null"}
Data atual: ${now}. Se não souber o fim, adicione 1 hora ao início.`
      try {
        const raw    = await callAI([{ role: 'user', content: lastMsg }], extractSystem, geminiKey)
        const clean  = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        const gcal   = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: parsed.summary, description: parsed.description,
            start: { dateTime: parsed.start, timeZone: 'America/Sao_Paulo' },
            end:   { dateTime: parsed.end,   timeZone: 'America/Sao_Paulo' },
          }),
        })
        if (gcal.ok) {
          const reply = voiceMode
            ? `Evento criado: ${parsed.summary}`
            : `✅ **Evento criado!**\n\n📅 **${parsed.summary}**\n⏰ ${new Date(parsed.start).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}`
          return NextResponse.json({ reply, eventCreated: true })
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
${calInfo}
IMPORTANTE: NUNCA diga que criou ou salvou algo sem ter certeza. Se não conseguir executar uma ação, diga claramente.`

    const reply = await callAI(messages, system, geminiKey)
    return NextResponse.json({ reply })

  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Erro ao processar. Tente novamente.' })
  }
}
