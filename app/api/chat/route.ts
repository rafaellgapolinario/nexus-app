import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface Message { role: 'user' | 'assistant'; content: string }

function detectIntent(text: string) {
  const t = text.toLowerCase()
  if (/(anota|registra|salva|guarda|cria.*(nota|tarefa|lembrete)|me lembra|não esquecer|preciso fazer|tenho que)/i.test(t)) return 'save_note'
  if (/(cria.*evento|coloca na agenda|quero agendar|marca.*(reunião|consulta|compromisso)|adiciona.*calendário|agenda.*para)/i.test(t)) return 'create_event'
  if (/(academia|exercício|treino|meditar|beber água|dormir cedo|hábito|rotina diária)/i.test(t)) return 'save_habit'
  if (/(gastei|comprei|paguei|recebi|salário|limite.*gasto|budget|orçamento|finança)/i.test(t)) return 'save_finance'
  if (/(projeto|sprint|milestone|deadline|entrega|fase do)/i.test(t)) return 'save_project'
  return 'chat'
}

async function callAI(messages: Message[], system: string, stream = false, geminiKey?: string): Promise<Response | string> {
  if (process.env.OPENROUTER_API_KEY) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://nexus-app-inky-beta.vercel.app' },
      body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages: [{ role: 'system', content: system }, ...messages], max_tokens: 500, temperature: 0.2, stream }),
    })
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
    if (stream) return res
    return (await res.json()).choices[0].message.content as string
  }
  const key = geminiKey || process.env.GEMINI_API_KEY
  if (!key) throw new Error('No AI key')
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 500, temperature: 0.2 } }) })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  return (await res.json()).candidates[0].content.parts[0].text as string
}

export async function POST(req: NextRequest) {
  const { messages, userName, lang, calendarContext, geminiKey, voiceMode, accessToken, ttsEnabled } = await req.json()
  const lastMsg = messages[messages.length - 1]?.content || ''
  const intent = detectIntent(lastMsg)
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const calInfo = calendarContext ? `AGENDA REAL;\n${calendarContext}\nNUNCA invente eventos.` : 'AGENDA: Não carregada.'
  const voiceRule = voiceMode ? 'MODO VOZ: Máximo 2 frases curtas. Sem markdown.' : 'Formatação markdown permitida.'
  const system = `Você é Nexus, assistente pessoal de ${userName || 'usuário'}. Responda APENAS em ${lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português brasileiro'}. Data: ${now}\n${voiceRule}\n${calInfo}`
  if (ttsEnabled && voiceMode) {
    try { const reply = await callAI(messages, system, false, geminiKey) as string; return Response.json({ reply }) } catch { return Response.json({ reply: 'Erro.' }) }
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const upstream = await callAI(messages, system, true, geminiKey) as Response
      const encoder = new TextEncoder(); const stream = new TransformStream(); const writer = stream.writable.getWriter()
      const reader = upstream.body!.getReader(); const decoder = new TextDecoder()
      ;(async () => { try { while (true) { const { done, value } = await reader.read(); if (done) break; for (const l of decoder.decode(value).split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')) { try { const j = JSON.parse(l.slice(6)); const tx = j.choices?.[0]?.delta?.content; if (tx) await writer.write(encoder.encode(`data: ${JSON.stringify({ text: tx })}\n\n`)) } catch {} } } } finally { await writer.close() } })()
      return new Response(stream.readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
    } catch {}
  }
  try { const reply = await callAI(messages, system, false, geminiKey) as string; return Response.json({ reply }) } catch { return Response.json({ reply: 'Erro. Tente novamente.' }) }
}
