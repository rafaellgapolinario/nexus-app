import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

    const apiKey   = process.env.ELEVENLABS_API_KEY
    const voiceId  = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'

    if (!apiKey) return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 })

    // Clean text for TTS
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[⚡🤖📅💬⏰☀️📊🔥💡🎉🛡️⭐🚀💳🧠⚙️✅❌📋🗓]/g, '')
      .substring(0, 400)

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('ElevenLabs error:', err)
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
    }

    const audioBuffer = await res.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
