import { apiUrl } from '../config/api'

export async function sendChatMessage(
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.content as string
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'))
    return res.ok
  } catch {
    return false
  }
}
