import { NextRequest, NextResponse } from 'next/server'
import { replyToPost, publishPost } from '@/lib/threads-api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content = body.content || body.text || ''
    const threadsPostId = body.threadsPostId || body.postId || ''
    const accountId = body.accountId || ''

    if (!content) {
      return NextResponse.json({ error: '回覆內容不能為空' }, { status: 400 })
    }

    if (threadsPostId) {
      try {
        const publishedId = await replyToPost(threadsPostId, content)
        return NextResponse.json({ ok: true, publishedId, message: '已回覆到 Threads！', accountId })
      } catch (replyError: any) {
        return NextResponse.json({ error: '回覆失敗', message: replyError.message }, { status: 500 })
      }
    } else {
      const publishedId = await publishPost(content)
      return NextResponse.json({ ok: true, publishedId, message: '已發布到 Threads！', accountId })
    }
  } catch (e: any) {
    console.error('Publish error:', e)
    return NextResponse.json({ error: '發布失敗', message: e.message }, { status: 500 })
  }
}
