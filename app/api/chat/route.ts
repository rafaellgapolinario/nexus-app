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
      temperature: 0.7,
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
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
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
    const { messages, userName, lang, calendarContext, geminiKey, voiceMode } = await req.json()

    const langNames: Record<string, string> = {
      pt: 'português brasileiro', en: 'English', es: 'español',
    }

    // Voice mode: shorter, more conversational responses
    const voiceInstruction = voiceMode
      ? 'Responda de forma MUITO curta e conversacional (máx 2 frases). Sem markdown, sem listas, sem emojis. Fale como se estivesse numa conversa oral.'
      : 'Seja direto e objetivo. Máximo 3 parágrafos curtos.'

    const systemPrompt = `Você é Nexus, assistente inteligente de ${userName || 'usuário'}.
Responda APENAS em ${langNames[lang] || 'português brasileiro'}.
Você tem acesso ao Google Calendar e pode ajudar com agenda, tarefas, produtividade e rotina.
${voiceInstruction}
${calendarContext ? `Contexto da agenda: ${calendarContext}` : ''}
Data/hora atual: ${new Date().toLocaleString('pt-BR')}`

    let reply: string

    if (process.env.OPENROUTER_API_KEY) {
      reply = await callOpenRouter(messages, systemPrompt)
    } else if (geminiKey || process.env.GEMINI_API_KEY) {
      reply = await callGemini(messages, systemPrompt, geminiKey || process.env.GEMINI_API_KEY!)
    } else {
      reply = lang === 'en'
        ? 'Configure an AI API key in Settings to enable smart responses.'
        : 'Configure uma chave de API em Configurações para ativar respostas inteligentes.'
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
