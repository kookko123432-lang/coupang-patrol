import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateAIReply } from '@/lib/ai-generator'

const DEMO_USER_ID = 'demo_user'

export async function POST(req: NextRequest) {
  try {
    const { scannedPostId, productInfo } = await req.json()

    const post = await prisma.scannedPost.findUnique({
      where: { id: scannedPostId },
    })

    if (!post) return NextResponse.json({ error: '貼文不存在' }, { status: 404 })

    const replyContent = await generateAIReply({
      postContent: post.content,
      authorName: post.authorName,
      brandTone: 'casual',
      productName: productInfo || '酷澎好物',
      productDescription: '',
      affiliateUrl: 'https://www.coupang.com',
    })

    const reply = await prisma.generatedReply.create({
      data: {
        userId: DEMO_USER_ID,
        scannedPostId,
        content: replyContent,
        status: 'pending',
      },
    })

    return NextResponse.json(reply)
  } catch {
    return NextResponse.json({ error: '生成失敗' }, { status: 500 })
  }
}
