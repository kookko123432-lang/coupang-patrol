// Threads API Client - handles all interactions with Threads/Meta API
// Supports multi-account: token stored per account in Redis

const API_BASE = 'https://graph.threads.net/v1.0'

// Cache: { accountId: { token, userId, checkedAt } }
const tokenCache = new Map<string, { token: string; userId: string; checkedAt: number }>()

async function refreshLongLivedToken(accessToken: string, accountId: string): Promise<string | null> {
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
      await set(`threads_token_${accountId}`, {
        accessToken: data.access_token,
        obtainedAt: new Date().toISOString(),
        expiresIn: data.expires_in || 5183944,
      })
      console.log('Token refreshed for account', accountId)
      return data.access_token
    }
  } catch (e) {
    console.error('Token refresh error:', e)
  }
  return null
}

/** Get token and userId for a specific account (or default) */
export async function getTokenAndUserId(accountId?: string): Promise<{ token: string; userId: string }> {
  // Default account ID (first threads account)
  const effectiveId = accountId || 'default'

  // Check cache
  const cached = tokenCache.get(effectiveId)
  if (cached && Date.now() - cached.checkedAt < 300000) {
    return { token: cached.token, userId: cached.userId }
  }

  try {
    const { get } = await import('./store')
    
    // Try account-specific key first
    let data = accountId ? await get(`threads_token_${accountId}`) : null
    if (!data) data = await get('threads_token') // fallback to default

    if (data?.accessToken) {
      const obtainedAt = data.obtainedAt ? new Date(data.obtainedAt).getTime() : 0
      const age = Date.now() - obtainedAt

      // Auto-refresh if older than 50 days
      if (obtainedAt > 0 && age > 50 * 24 * 60 * 60 * 1000) {
        const refreshed = await refreshLongLivedToken(data.accessToken, effectiveId)
        if (refreshed) {
          data.accessToken = refreshed
        }
      }

      // Get userId — from stored data or resolve from API
      let userId = data.userId || data.platformUserId
      if (!userId) {
        try {
          const profileRes = await fetch(`${API_BASE}/me?fields=id&access_token=${data.accessToken}`)
          if (profileRes.ok) {
            const profile = await profileRes.json()
            userId = profile.id
          }
        } catch {}
      }

      if (userId) {
        tokenCache.set(effectiveId, { token: data.accessToken, userId, checkedAt: Date.now() })
        return { token: data.accessToken, userId }
      }
    }
  } catch {}

  // Final fallback: env var (no userId available)
  const token = (process.env.THREADS_ACCESS_TOKEN || '').trim()
  return { token, userId: '' }
}

export async function getToken(): Promise<string> {
  const { token } = await getTokenAndUserId()
  return token
}

export function isTokenConfigured(): boolean {
  return !!(process.env.THREADS_ACCESS_TOKEN || '').trim()
}

export async function getProfile(accountId?: string) {
  const { token } = await getTokenAndUserId(accountId)
  if (!token) return null
  const res = await fetch(`${API_BASE}/me?fields=id,username,name,threads_profile_picture_url&access_token=${token}`)
  if (!res.ok) return null
  return res.json()
}

export async function getQuota(accountId?: string) {
  const { token, userId } = await getTokenAndUserId(accountId)
  if (!token || !userId) return null
  const res = await fetch(`${API_BASE}/${userId}/threads_publishing_limit?fields=config,quota_usage&access_token=${token}`)
  if (!res.ok) return null
  return res.json()
}

export async function getMyPosts(limit: number = 10, accountId?: string) {
  const { token, userId } = await getTokenAndUserId(accountId)
  if (!token || !userId) return []
  const res = await fetch(`${API_BASE}/${userId}/threads?fields=id,text,timestamp,media_type&limit=${limit}&access_token=${token}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

export async function publishPost(text: string, accountId?: string): Promise<string> {
  const { token, userId } = await getTokenAndUserId(accountId)
  if (!token || !userId) throw new Error('未設定 Threads Token 或帳號')

  const createRes = await fetch(`${API_BASE}/${userId}/threads?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Create post error (${createRes.status}): ${err}`)
  }
  const { id: mediaId } = await createRes.json()

  const publishRes = await fetch(`${API_BASE}/${userId}/threads_publish?access_token=${token}`, {
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

export async function replyToPost(postId: string, text: string, accountId?: string): Promise<string> {
  const { token, userId } = await getTokenAndUserId(accountId)
  if (!token || !userId) throw new Error('未設定 Threads Token 或帳號')

  const createRes = await fetch(`${API_BASE}/${userId}/threads?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text, reply_to_id: postId }),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Create reply error (${createRes.status}): ${err}`)
  }
  const { id: mediaId } = await createRes.json()

  const publishRes = await fetch(`${API_BASE}/${userId}/threads_publish?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: mediaId }),
  })
  if (!publishRes.ok) {
    const err = await publishRes.text()
    throw new Error(`Publish reply error (${publishRes.status}): ${err}`)
  }
  const { id } = await publishRes.json()
  return id
}

export async function getPostInsights(postId: string, accountId?: string) {
  const { token } = await getTokenAndUserId(accountId)
  if (!token) return null
  const res = await fetch(`${API_BASE}/${postId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.data || []
}
