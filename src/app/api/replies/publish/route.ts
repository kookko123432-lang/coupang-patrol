import { NextRequest, NextResponse } from 'next/server'
import { replyToPost, publishPost } from '@/lib/threads-api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content = body.content || body.text || ''
    let threadsPostId = body.threadsPostId || body.postId || ''
    const authorName = body.authorName || ''

    if (!content) {
      return NextResponse.json({ error: '回覆內容不能為空' }, { status: 400 })
    }

    if (threadsPostId) {
      // Try to reply - shortcode IDs (< 20 chars) might not work with Threads API
      // If reply fails, fall back to standalone post
      const publishedId = await replyToPost(threadsPostId, content)
        return NextResponse.json({ ok: true, publishedId, message: '已回覆到 Threads！' })
      } catch (replyError: any) {
        return NextResponse.json({ error: '回覆失敗', message: replyError.message }, { status: 500 })
      }
    } else {
      const publishedId = await publishPost(content)
      return NextResponse.json({ ok: true, publishedId, message: '已發布到 Threads！' })
    }
  } catch (e: any) {
    console.error('Publish error:', e)
    return NextResponse.json({ error: '發布失敗', message: e.message }, { status: 500 })
  }
}
