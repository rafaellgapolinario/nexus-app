import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface Message { role: 'user' | 'assistant' | 'system'; content: string }

async function callOpenRouter(messages: Message[], systemPrompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nexus-app.vercel.app',
      'X-Title': 'Nexus AI Assistant',
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
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
  // Flatten messages into Gemini format
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
    const { messages, userName, lang, calendarContext, geminiKey } = await req.json()

    const langNames: Record<string, string> = {
      pt: 'português brasileiro', en: 'English', es: 'español'
    }
    const systemPrompt = `You are Nexus, a productivity AI assistant for ${userName || 'user'}. 
Respond ONLY in ${langNames[lang] || 'português brasileiro'}.
You help manage Google Calendar events, tasks, and productivity.
Be direct, friendly, and practical. Maximum 3 short paragraphs.
${calendarContext ? `User's calendar context: ${calendarContext}` : ''}`

    let reply: string

    // Priority: OpenRouter (server key) → Gemini (user key) → fallback
    if (process.env.OPENROUTER_API_KEY) {
      reply = await callOpenRouter(messages, systemPrompt)
    } else if (geminiKey || process.env.GEMINI_API_KEY) {
      reply = await callGemini(messages, systemPrompt, geminiKey || process.env.GEMINI_API_KEY!)
    } else {
      // Graceful fallback
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''
      if (lastMsg.includes('reunião') || lastMsg.includes('meeting') || lastMsg.includes('evento')) {
        reply = lang === 'en'
          ? '📅 To create events with AI, configure an API key in Settings (free at aistudio.google.com) or set OPENROUTER_API_KEY in your Vercel environment.'
          : '📅 Para criar eventos com IA, configure uma chave de API em Configurações (grátis em aistudio.google.com) ou defina OPENROUTER_API_KEY no ambiente Vercel.'
      } else {
        reply = lang === 'en'
          ? '🔑 Configure an AI API key in Settings to enable smart responses. Your Google Calendar is already connected!'
          : '🔑 Configure uma chave de API em Configurações para ativar respostas inteligentes. Seu Google Calendar já está conectado!'
      }
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
