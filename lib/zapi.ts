export async function sendZapi(
  instance: string,
  token: string,
  clientToken: string,
  phone: string,
  message: string
): Promise<boolean> {
  if (!instance || !token) return false
  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (clientToken) headers['Client-Token'] = clientToken
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: phone.replace(/\D/g, ''), message }),
    })
    return res.ok
  } catch {
    return false
  }
}
