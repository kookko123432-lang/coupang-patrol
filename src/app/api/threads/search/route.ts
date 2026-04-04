import { NextRequest, NextResponse } from 'next/server'
import { getTokenAndUserId } from '@/lib/threads-api'

export async function GET(req: NextRequest) {
  const { token, userId } = await getTokenAndUserId()
  if (!token || !userId) {
    return NextResponse.json({ error: '未連結帳號' }, { status: 400 })
  }

  const q = req.nextUrl.searchParams.get('q') || '酷澎'
  
  // Try multiple endpoint formats
  const attempts = [
    // Format 1: /v1.0/{user_id}/threads_keyword_search
    { name: 'user_id/threads_keyword_search', url: `https://graph.threads.net/v1.0/${userId}/threads_keyword_search?q=${encodeURIComponent(q)}&access_token=${token}` },
    // Format 2: /v1.0/me/threads_keyword_search  
    { name: 'me/threads_keyword_search', url: `https://graph.threads.net/v1.0/me/threads_keyword_search?q=${encodeURIComponent(q)}&access_token=${token}` },
    // Format 3: /v1.0/threads_keyword_search (no user context)
    { name: 'threads_keyword_search (root)', url: `https://graph.threads.net/v1.0/threads_keyword_search?q=${encodeURIComponent(q)}&access_token=${token}` },
    // Format 4: /v1.0/{user_id}/threads_search
    { name: 'user_id/threads_search', url: `https://graph.threads.net/v1.0/${userId}/threads_search?q=${encodeURIComponent(q)}&access_token=${token}` },
  ]

  const results: any = {}

  for (const attempt of attempts) {
    try {
      console.log(`Trying: ${attempt.name}`)
      const res = await fetch(attempt.url)
      const data = await res.json()
      results[attempt.name] = {
        status: res.status,
        data: data,
      }
      if (res.ok && data.data) {
        // Found a working endpoint!
        return NextResponse.json({
          working: attempt.name,
          keyword: q,
          results: data.data,
          raw: data,
        })
      }
    } catch (e: any) {
      results[attempt.name] = { error: e.message }
    }
  }

  return NextResponse.json({ attempts: results, keyword: q })
}
