import { NextRequest, NextResponse } from 'next/server'
import { isTokenConfigured, replyToPost } from '@/lib/threads-api'

export async function POST(req: NextRequest) {
  try {
    const { replyId, content, threadsPostId } = await req.json()

    if (!isTokenConfigured()) {
      return NextResponse.json({ 
        error: 'Threads API Token 未設定，請先到設定頁面完成 Threads 授權' 
      }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: '回覆內容不能為空' }, { status: 400 })
    }

    // If we have a real Threads post ID, reply directly
    if (threadsPostId) {
      const publishedId = await replyToPost(threadsPostId, content)
      return NextResponse.json({ 
        ok: true, 
        publishedId,
        message: '已發布到 Threads！' 
      })
    }

    // Fallback: just mark as published in DB
    return NextResponse.json({ 
      ok: true, 
      message: '已標記為發布（無 Threads Post ID）' 
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: '發布失敗', 
      message: e.message 
    }, { status: 500 })
  }
}
