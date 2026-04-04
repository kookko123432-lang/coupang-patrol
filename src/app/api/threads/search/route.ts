import { NextRequest, NextResponse } from 'next/server'
import { getTokenAndUserId } from '@/lib/threads-api'

export async function GET(req: NextRequest) {
  const { token, userId } = await getTokenAndUserId()
  if (!token || !userId) {
    return NextResponse.json({ error: '未設定 Token' }, { status: 400 })
  }

  const keyword = req.nextUrl.searchParams.get('q') || '宵夜'
  const limit = req.nextUrl.searchParams.get('limit') || '10'

  // Try Threads keyword search API
  const searchUrl = `https://graph.threads.net/v1.0/${userId}/threads_keyword_search?q=${encodeURIComponent(keyword)}&fields=id,text,username,timestamp,like_count,shortcode,permalink&limit=${limit}&access_token=${token}`

  console.log('Searching:', searchUrl.replace(token, '***'))

  try {
    const res = await fetch(searchUrl)
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: 'Search failed', status: res.status, details: data }, { status: 500 })
    }

    return NextResponse.json({ keyword, results: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
