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
        const publishedId = await replyToPost(threadsPostId, content, accountId || undefined)
        return NextResponse.json({ ok: true, publishedId, message: '已回覆到 Threads！', accountId })
      } catch (replyError: any) {
        const errMsg = replyError.message || ''
        let userMsg = errMsg
        if (errMsg.includes('not a valid threads_media')) {
          userMsg = '回覆失敗：需要通過 Meta App Review（threads_manage_replies 權限）才能回覆別人的貼文。請到 Meta App Dashboard 提交審核。'
        }
        return NextResponse.json({ error: '回覆失敗', message: userMsg }, { status: 500 })
      }
    } else {
      try {
        const publishedId = await publishPost(content, accountId || undefined)
        return NextResponse.json({ ok: true, publishedId, message: '已發布到 Threads！', accountId })
      } catch (pubError: any) {
        return NextResponse.json({ error: '發布失敗', message: pubError.message }, { status: 500 })
      }
    }
  } catch (e: any) {
    console.error('Publish error:', e)
    return NextResponse.json({ error: '請求處理失敗', message: e.message }, { status: 500 })
  }
}
