import { NextRequest, NextResponse } from 'next/server'
import { generateAIReply } from '@/lib/ai-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postContent, authorName, productInfo } = body

    const content = postContent || '一篇關於購物的貼文'
    const author = authorName || 'Threads 用戶'
    const product = productInfo || '酷澎好物'

    const replyContent = await generateAIReply({
      postContent: content,
      authorName: author,
      brandTone: 'casual',
      productName: product,
      productDescription: '',
      affiliateUrl: 'https://www.coupang.com',
    })

    return NextResponse.json({ content: replyContent })
  } catch (e: any) {
    return NextResponse.json({ error: '生成失敗', message: e.message }, { status: 500 })
  }
}
