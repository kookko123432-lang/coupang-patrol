// Threads API Client - handles all interactions with Threads/Meta API

const THREADS_USER_ID = '26463285206638172'
const API_BASE = 'https://graph.threads.net/v1.0'

// Dynamic token: read from Redis first, fallback to env var
let cachedToken: string | null = null
let tokenCheckedAt = 0

export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - tokenCheckedAt < 300000) return cachedToken

  try {
    const { get } = await import('./store')
    const data = await get('threads_token')
    if (data?.accessToken) {
      cachedToken = data.accessToken
      tokenCheckedAt = Date.now()
      return cachedToken!
    }
  } catch {}

  cachedToken = process.env.THREADS_ACCESS_TOKEN || ''
  tokenCheckedAt = Date.now()
  return cachedToken
}

export function isTokenConfigured(): boolean {
  // Sync check — returns true if env var is set or cache is populated
  return !!(process.env.THREADS_ACCESS_TOKEN || cachedToken)
}

export async function getProfile() {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/${THREADS_USER_ID}?fields=id,username,name&access_token=${token}`)
  if (!res.ok) throw new Error(`Profile API error: ${res.status}`)
  return res.json()
}

export async function getQuota() {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads_publishing_limit?fields=quota_usage,config&access_token=${token}`)
  if (!res.ok) throw new Error(`Quota API error: ${res.status}`)
  const data = await res.json()
  return data.data?.[0]
}

export async function getMyPosts(limit: number = 10) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads?fields=id,text,timestamp,media_type,like_count&limit=${limit}&access_token=${token}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

export async function publishPost(text: string): Promise<string> {
  const token = await getToken()

  // Step 1: Create media container
  const createRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Create post error (${createRes.status}): ${err}`)
  }

  const createData = await createRes.json()
  const mediaId = createData.id

  // Step 2: Publish
  const publishRes = await fetch(`${API_BASE}/${THREADS_USER_ID}/threads_publish?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: mediaId }),
  })

  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Publish error (${publishRes.status}): ${err}`)
  }

  const publishData = await publishRes.json()
  return publishData.id
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

export async function getPostReplies(postId: string, limit: number = 10) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/${postId}/replies?fields=id,text,timestamp,username&limit=${limit}&access_token=${token}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}
