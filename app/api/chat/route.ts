import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface Message { role: 'user' | 'assistant' | 'system'; content: string }

async function callOpenRouter(messages: Message[], systemPrompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nexus-app-inky-beta.vercel.app',
      'X-Title': 'Nexus AI Assistant',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 500,
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
        generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userName, lang, calendarContext, geminiKey, voiceMode, notesContext } = await req.json()

    const langNames: Record<string, string> = {
      pt: 'português brasileiro', en: 'English', es: 'español',
    }

    const now = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    })

    const voiceInstruction = voiceMode
      ? 'Responda de forma MUITO curta e conversacional (máx 2 frases). Sem markdown, sem listas, sem emojis. Fale como numa conversa oral natural.'
      : 'Seja direto e objetivo. Use markdown quando ajudar a organizar a resposta.'

    // Build calendar context
    const calSection = calendarContext
      ? `\n\nAGENDA REAL DO USUÁRIO (USE ESTES DADOS, NÃO INVENTE):\n${calendarContext}\nSe a agenda estiver vazia, diga que não há eventos cadastrados. NUNCA invente eventos.`
      : '\n\nAGENDA: Nenhum evento carregado no momento. Se perguntarem sobre agenda, oriente a sincronizar o Google Calendar primeiro.'

    // Notes context
    const notesSection = notesContext
      ? `\n\nANOTAÇÕES DO USUÁRIO:\n${notesContext}`
      : ''

    const systemPrompt = `Você é Nexus, assistente pessoal inteligente de ${userName || 'usuário'}.
Responda APENAS em ${langNames[lang] || 'português brasileiro'}.
Data e hora atual: ${now}

REGRAS IMPORTANTES:
- NUNCA invente eventos, tarefas, compromissos ou dados que não foram fornecidos
- Se não tiver informação real, diga claramente que não tem acesso a ela
- Só fale sobre eventos que estão listados na AGENDA REAL abaixo
- Para criar eventos, peça confirmação dos detalhes antes
${voiceInstruction}
${calSection}${notesSection}`

    let reply: string

    if (process.env.OPENROUTER_API_KEY) {
      reply = await callOpenRouter(messages, systemPrompt)
    } else if (geminiKey || process.env.GEMINI_API_KEY) {
      reply = await callGemini(messages, systemPrompt, geminiKey || process.env.GEMINI_API_KEY!)
    } else {
      reply = lang === 'en'
        ? 'Please configure an AI API key in Settings.'
        : 'Configure uma chave de API em Configurações para ativar respostas inteligentes.'
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
