// Threads API Client - handles all interactions with Threads/Meta API

const THREADS_USER_ID = '26463285206638172'
const THREADS_TOKEN = process.env.THREADS_ACCESS_TOKEN || ''
const API_BASE = 'https://graph.threads.net/v1.0'

export interface ThreadsProfile {
  id: string
  username: string
  name: string
}

export interface ThreadsPost {
  id: string
  text?: string
  timestamp: string
  media_type: string
  username?: string
  like_count?: number
  replies_count?: number
}

export interface ThreadsPublishResult {
  id: string
  media_id?: string
}

export interface QuotaInfo {
  quota_usage: number
  config: {
    quota_total: number
    quota_duration: number
  }
}

// Check if token is configured
export function isTokenConfigured(): boolean {
  return THREADS_TOKEN.length > 10
}

// Get user profile
export async function getProfile(): Promise<ThreadsProfile> {
  const res = await fetch(
    `${API_BASE}/${THREADS_USER_ID}?fields=id,username,name&access_token=${THREADS_TOKEN}`
  )
  if (!res.ok) throw new Error(`Threads API error: ${res.status}`)
  return res.json()
}

// Get publishing quota
export async function getQuota(): Promise<QuotaInfo> {
  const res = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads_publishing_limit?fields=quota_usage,config&access_token=${THREADS_TOKEN}`
  )
  if (!res.ok) throw new Error(`Quota API error: ${res.status}`)
  const data = await res.json()
  return data.data[0]
}

// Get user's own posts
export async function getMyPosts(limit: number = 10): Promise<ThreadsPost[]> {
  const res = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads?fields=id,text,timestamp,media_type,like_count&limit=${limit}&access_token=${THREADS_TOKEN}`
  )
  if (!res.ok) throw new Error(`Get posts error: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

// Publish a text post (two-step process)
export async function publishPost(text: string): Promise<string> {
  // Step 1: Create media container
  const createRes = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads?access_token=${THREADS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'TEXT',
        text,
      }),
    }
  )
  if (!createRes.ok) {
    const err = await createRes.json()
    throw new Error(`Create post error: ${JSON.stringify(err)}`)
  }
  const { id: mediaId } = await createRes.json()

  // Step 2: Publish
  const publishRes = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads_publish?access_token=${THREADS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ creation_id: mediaId }),
    }
  )
  if (!publishRes.ok) {
    const err = await publishRes.json()
    throw new Error(`Publish error: ${JSON.stringify(err)}`)
  }
  const { id } = await publishRes.json()
  return id
}

// Reply to a post (comment on someone else's post)
export async function replyToPost(postId: string, text: string): Promise<string> {
  // Step 1: Create reply container
  const createRes = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads?access_token=${THREADS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'TEXT',
        text,
        reply_to_id: postId,
      }),
    }
  )
  if (!createRes.ok) {
    const err = await createRes.json()
    throw new Error(`Create reply error: ${JSON.stringify(err)}`)
  }
  const { id: mediaId } = await createRes.json()

  // Step 2: Publish reply
  const publishRes = await fetch(
    `${API_BASE}/${THREADS_USER_ID}/threads_publish?access_token=${THREADS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ creation_id: mediaId }),
    }
  )
  if (!publishRes.ok) {
    const err = await publishRes.json()
    throw new Error(`Publish reply error: ${JSON.stringify(err)}`)
  }
  const { id } = await publishRes.json()
  return id
}

// Get post insights (likes, views, etc.)
export async function getPostInsights(postId: string) {
  const res = await fetch(
    `${API_BASE}/${postId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${THREADS_TOKEN}`
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.data || []
}

// Get replies to a post
export async function getPostReplies(postId: string, limit: number = 10) {
  const res = await fetch(
    `${API_BASE}/${postId}/replies?fields=id,text,timestamp,username&limit=${limit}&access_token=${THREADS_TOKEN}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}
