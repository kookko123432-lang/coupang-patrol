import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    const replies = await prisma.generatedReply.findMany({
      where: { userId: DEMO_USER_ID },
      include: { scannedPost: true },
      orderBy: { id: 'desc' as const },
    })
    return NextResponse.json(replies)
  } catch {
    return NextResponse.json([])
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, content, status } = await req.json()
    const updated = await prisma.generatedReply.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
