import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'no text' }, { status: 400 })

  const key = process.env.AZURE_TTS_KEY
  const region = process.env.AZURE_TTS_REGION || 'brazilsouth'

  if (!key) return NextResponse.json({ error: 'no key' }, { status: 503 })

  // Limpa markdown e caracteres especiais
  const clean = text.replace(/[*_`#>\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 800)
  const escaped = clean.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c))

  const ssml = `<speak version='1.0' xml:lang='pt-BR'>
    <voice name='pt-BR-JulioNeural'>
      <prosody rate='+6%' pitch='-0.3st' style='assistant'>${escaped}</prosody>
    </voice>
  </speak>`

  try {
    // Token de acesso
    const tokenRes = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key } }
    )
    if (!tokenRes.ok) throw new Error('token failed')
    const token = await tokenRes.text()

    // Síntese
    const ttsRes = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: ssml,
      }
    )
    if (!ttsRes.ok) throw new Error(`tts ${ttsRes.status}`)

    const buffer = await ttsRes.arrayBuffer()
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return NextResponse.json({ audioBase64: b64 })
  } catch (err) {
    console.error('[TTS]', err)
    return NextResponse.json({ error: 'tts_failed' }, { status: 500 })
  }
}
