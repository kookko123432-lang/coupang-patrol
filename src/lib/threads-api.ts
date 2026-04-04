// Threads API Client - handles all interactions with Threads/Meta API
// Token is read from Redis at runtime, supports auto-refresh

const THREADS_USER_ID = '26463285206638172'
const API_BASE = 'https://graph.threads.net/v1.0'

let cachedToken: string | null = null
let tokenCheckedAt = 0

async function refreshLongLivedToken(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${accessToken}`
    )
    if (!res.ok) {
      console.error('Token refresh failed:', await res.text())
      return null
    }
    const data = await res.json()
    if (data.access_token) {
      const { set } = await import('./store')
      await set('threads_token', {
        accessToken: data.access_token,
        obtainedAt: new Date().toISOString(),
        expiresIn: data.expires_in || 5183944,
      })
      console.log('Token refreshed successfully, expires in:', data.expires_in)
      return data.access_token
    }
  } catch (e) {
    console.error('Token refresh error:', e)
  }
  return null
}

export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - tokenCheckedAt < 300000) return cachedToken

  try {
    const { get } = await import('./store')
    const data = await get('threads_token')
    if (data?.accessToken) {
      const obtainedAt = data.obtainedAt ? new Date(data.obtainedAt).getTime() : 0
      // Auto-refresh if older than 50 days
      if (age > 50 * 24 * 60 * 60 * 1000) {
        const refreshed = await refreshLongLivedToken(data.accessToken)
        if (refreshed) {
          cachedToken = refreshed
          tokenCheckedAt = Date.now()
          return cachedToken!
        }
      }
      cachedToken = data.accessToken
      tokenCheckedAt = Date.now()
      return cachedToken!
    }
  } catch {}

  cachedToken = (process.env.THREADS_ACCESS_TOKEN || '').trim()
  tokenCheckedAt = Date.now()
  return cachedToken
}

export async function publishPost(text: string): Promise<string> {
  const token = await getToken()

  const createRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Create post error (${createRes.status}): ${err}`)
  }
  const { id: mediaId } = await createRes.json()
  const publishRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads_publish?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: mediaId }),
  })
  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Publish error (${publishRes.status}): ${err}`)
  }
  const { id } = await publishRes.json()
  return id
}

export async function replyToPost(postId: string, text: string): Promise<string> {
  const token = await getToken()

  const createRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text, reply_to_id: postId }),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Create reply error: ${err}`)
  }
  const { id: mediaId } = await createRes.json()
  const publishRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads_publish?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: mediaId }),
  })
  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Publish reply error: ${err}`)
  }
  const { id } = await publishRes.json()
  return id
}

export async function getPostInsights(postId: string) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/${postId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.data || []
}

