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
      // Convert short shortcode (e.g. "DWeGQiejw8D") to long media ID if needed
      if (threadsPostId.length < 20) {
        threadsPostId = shortcodeToMediaId(threadsPostId)
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

// Convert Threads shortcode (e.g. "DWeGQiejw8D") to numeric media ID
function shortcodeToMediaId(shortcode: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let mediaId = 0n
  for (const char of shortcode) {
    const idx = alphabet.indexOf(char)
    if (idx === -1) return shortcode // fallback: return as-is
    mediaId = mediaId * 64n + BigInt(idx)
  }
  return mediaId.toString()
}
