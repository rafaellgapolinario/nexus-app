import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/db'

export const runtime = 'nodejs'

interface Message { role: 'user' | 'assistant' | 'system'; content: string }

async function callOpenRouter(messages: Message[], systemPrompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nexus-app-inky-beta.vercel.app',
      'X-Title': 'Nexus AI',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.3,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

async function callGemini(messages: Message[], systemPrompt: string, apiKey: string): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...contents],
        generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

// Detect if message is a note/task/reminder intent
function detectNoteIntent(text: string): string | null {
  const t = text.toLowerCase()
  if (/(anota|registra|salva|guarda|lembra|não esquecer|não esquece|cria (uma |a )?(nota|tarefa|lembrete)|adiciona (uma |a )?(nota|tarefa|lembrete)|me lembra|me lembre)/i.test(t)) {
    return 'note'
  }
  if (/(cria (uma |a )?tarefa|adiciona (uma |a )?tarefa|preciso (fazer|completar|terminar)|tenho que|devo)/i.test(t)) {
    return 'task'
  }
  if (/(me lembra|me lembre|lembrete|avisa|avisa(-me)?|remind)/i.test(t)) {
    return 'reminder'
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userName, lang, calendarContext, geminiKey, voiceMode, userEmail } = await req.json()

    const langNames: Record<string, string> = {
      pt: 'português brasileiro', en: 'English', es: 'español',
    }

    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    const lastUserMsg = messages[messages.length - 1]?.content || ''
    const noteIntent  = detectNoteIntent(lastUserMsg)

    const voiceInstruction = voiceMode
      ? 'Responda de forma MUITO curta e conversacional (máx 2 frases). Sem markdown, sem listas, sem emojis.'
      : 'Seja direto e objetivo. Use markdown quando ajudar.'

    const calSection = calendarContext
      ? `\n\nAGENDA REAL (USE ESTES DADOS, NUNCA INVENTE):\n${calendarContext}`
      : '\n\nAGENDA: Nenhum evento carregado. Se perguntarem sobre agenda, oriente a sincronizar o Google Calendar.'

    // If note intent detected, ask AI to extract structured note
    const noteInstruction = noteIntent ? `
IMPORTANTE: O usuário quer criar uma anotação/tarefa/lembrete.
Extraia as informações e responda EXATAMENTE neste formato JSON (sem markdown, sem explicação):
{"action":"create_note","tipo":"nota|tarefa|lembrete","titulo":"título curto","conteudo":"conteúdo completo","lembrete_em":"ISO date ou null","reply":"confirmação em 1 frase curta para o usuário"}
` : ''

    const systemPrompt = `Você é Nexus, assistente pessoal de ${userName || 'usuário'}.
Responda APENAS em ${langNames[lang] || 'português brasileiro'}.
Data e hora atual: ${now}
REGRAS: NUNCA invente eventos ou dados. Só use informações reais fornecidas.
${voiceInstruction}${calSection}${noteInstruction}`

    let rawReply: string

    if (process.env.OPENROUTER_API_KEY) {
      rawReply = await callOpenRouter(messages, systemPrompt)
    } else if (geminiKey || process.env.GEMINI_API_KEY) {
      rawReply = await callGemini(messages, systemPrompt, geminiKey || process.env.GEMINI_API_KEY!)
    } else {
      return NextResponse.json({ reply: 'Configure uma chave de API em Configurações.' })
    }

    // Try to parse note action from AI response
    if (noteIntent && userEmail) {
      try {
        const clean = rawReply.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        if (parsed.action === 'create_note') {
          // Get user from DB
          const user = await getUserByEmail(userEmail)
          if (user) {
            const colorMap: Record<string, string> = {
              nota: '#7c6dfa', tarefa: '#22d3a0', lembrete: '#f59e0b'
            }
            await supabaseAdmin.from('notes').insert({
              user_id:    user.id,
              tipo:       parsed.tipo || 'nota',
              titulo:     parsed.titulo || null,
              conteudo:   parsed.conteudo || lastUserMsg,
              lembrete_em: parsed.lembrete_em || null,
              cor:        colorMap[parsed.tipo] || '#7c6dfa',
            })
          }
          return NextResponse.json({ reply: parsed.reply || 'Anotado! ✅', noteCreated: true })
        }
      } catch {
        // Not a note response, return as normal
      }
    }

    return NextResponse.json({ reply: rawReply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
