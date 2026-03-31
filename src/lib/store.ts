// Unified storage layer
// Uses Redis (via REDIS_URL) when available, falls back to in-memory

let memoryStore: Record<string, any> = {}

function getRedisUrl() {
  return process.env.REDIS_URL || ''
}

async function getRedis() {
  const url = getRedisUrl()
  if (!url) return null
  const Redis = (await import('ioredis')).default
  return new Redis(url)
}

export async function get(key: string): Promise<any> {
  const url = getRedisUrl()
  if (!url) return memoryStore[key] || null

  let redis: any
  try {
    redis = await getRedis()
    const data = await redis.get(`cp:${key}`)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Redis get error:', e)
    return memoryStore[key] || null
  } finally {
    redis?.disconnect()
  }
}

export async function set(key: string, value: any): Promise<void> {
  const url = getRedisUrl()
  if (!url) {
    memoryStore[key] = value
    return
  }

  let redis: any
  try {
    redis = await getRedis()
    await redis.set(`cp:${key}`, JSON.stringify(value))
  } catch (e) {
    console.error('Redis set error:', e)
    memoryStore[key] = value
  } finally {
    redis?.disconnect()
  }
}

export function isUsingRedis() {
  return !!getRedisUrl()
}
