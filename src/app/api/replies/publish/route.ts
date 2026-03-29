import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function POST(req: NextRequest) {
  try {
    const { replyId } = await req.json()

    const updated = await prisma.generatedReply.update({
      where: { id: replyId },
      data: { status: 'published', publishedAt: new Date() },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '發布失敗' }, { status: 500 })
  }
}
