import { NextRequest, NextResponse } from 'next/server'
import { replyToPost, publishPost, getToken } from '@/lib/threads-api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content = body.content || body.text || ''
    let threadsPostId = body.threadsPostId || body.postId || ''

    if (!content) {
      return NextResponse.json({ error: '回覆內容不能為空' }, { status: 400 })
    }

    if (threadsPostId) {
      // Check if this is a short ID (like "DWeGQiejw8D") — needs conversion to long media ID
      if (threadsPostId.length < 20) {
        try {
          const longId = await resolveShortId(threadsPostId)
          if (longId) {
            threadsPostId = longId
          }
        } catch (e) {
          console.error('Failed to resolve short ID:', e)
        }
      }

      const publishedId = await replyToPost(threadsPostId, content)
      return NextResponse.json({
        ok: true,
        publishedId,
        message: '已回覆到 Threads！',
      })
    } else {
      const publishedId = await publishPost(content)
      return NextResponse.json({
        ok: true,
        publishedId,
        message: '已發布到 Threads！',
      })
    }
  } catch (e: any) {
    console.error('Publish error:', e)
    return NextResponse.json({
      error: '發布失敗',
      message: e.message,
    }, { status: 500 })
  }
}

async function resolveShortId(shortId: string): Promise<string | null> {
  // Try to resolve a short Threads post ID to a long media ID
  // by fetching the post info via the Threads API
  const token = await getToken()
  
  // Method 1: Try the short ID directly as a media ID
  try {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${shortId}?fields=id&access_token=${token}`
    )
    if (res.ok) {
      const data = await res.json()
      if (data.id) return data.id
    }
  } catch {}

  return null
}
