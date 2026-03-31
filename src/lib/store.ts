// Unified storage layer
// Uses Vercel KV when KV_REST_API_URL is set, otherwise in-memory

let memoryStore: Record<string, any> = {}

function hasKV() {
  return !!process.env.KV_REST_API_URL
}

export async function get(key: string): Promise<any> {
  if (hasKV()) {
    const { kv } = await import('@vercel/kv')
    return await kv.get(key)
  }
  return memoryStore[key] || null
}

export async function set(key: string, value: any): Promise<void> {
  if (hasKV()) {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value)
    return
  }
  memoryStore[key] = value
}

export function isUsingKV() {
  return hasKV()
}
