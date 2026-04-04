import { NextRequest, NextResponse } from 'next/server'
import { getTokenAndUserId } from '@/lib/threads-api'

export async function GET(req: NextRequest) {
  const { token, userId } = await getTokenAndUserId()
  if (!token || !userId) {
    return NextResponse.json({ error: '未連結帳號' }, { status: 400 })
  }

  const q = req.nextUrl.searchParams.get('q') || '酷澎'
  
  // Try ALL possible endpoint formats for threads_keyword_search
  const attempts = [
    // Format 1: Edge on user node (most common for Meta APIs)
    { name: 'GET /{user_id}?fields=threads_keyword_search.q(x)', url: `https://graph.threads.net/v1.0/${userId}?fields=threads_keyword_search.q(${encodeURIComponent(q)})&access_token=${token}` },
    // Format 2: Separate edge with query params
    { name: 'GET /{user_id}/threads_keyword_search?q=x', url: `https://graph.threads.net/v1.0/${userId}/threads_keyword_search?q=${encodeURIComponent(q)}&limit=5&access_token=${token}` },
    // Format 3: POST method
    { name: 'POST /{user_id}/threads_keyword_search', url: `https://graph.threads.net/v1.0/${userId}/threads_keyword_search`, method: 'POST', body: `q=${encodeURIComponent(q)}` },
    // Format 4: Different field name
    { name: 'GET /me/threads_keyword_search', url: `https://graph.threads.net/v1.0/me/threads_keyword_search?q=${encodeURIComponent(q)}&limit=5&access_token=${token}` },
    // Format 5: On business account
    { name: 'GET /me?fields=threads_keyword_search', url: `https://graph.threads.net/v1.0/me?fields=threads_keyword_search.q(${encodeURIComponent(q)})&access_token=${token}` },
  ]

  const results: any = {}

  for (const attempt of attempts) {
    try {
      const opts: any = { headers: { Authorization: `Bearer ${token}` } }
      if (attempt.method === 'POST') {
        opts.method = 'POST'
        opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        opts.body = attempt.body + `&access_token=${token}`
      }
      const res = await fetch(attempt.url, opts)
      const data = await res.json()
      results[attempt.name] = { status: res.status, ok: res.ok, data }
      if (res.ok && (data.data || data.threads_keyword_search)) {
        return NextResponse.json({ working: attempt.name, keyword: q, result: data })
      }
    } catch (e: any) {
      results[attempt.name] = { error: e.message }
    }
  }

  return NextResponse.json({ keyword: q, userId, attempts: results })
}
