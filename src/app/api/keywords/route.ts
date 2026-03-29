import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    const keywords = await prisma.keyword.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(keywords)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()
    if (!keyword) return NextResponse.json({ error: '關鍵字不能為空' }, { status: 400 })

    const created = await prisma.keyword.create({
      data: { userId: DEMO_USER_ID, keyword },
    })
    return NextResponse.json(created)
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json({ error: '關鍵字已存在' }, { status: 409 })
    }
    return NextResponse.json({ error: '建立失敗' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, keyword, active } = await req.json()
    const updated = await prisma.keyword.update({
      where: { id },
      data: { ...(keyword !== undefined && { keyword }), ...(active !== undefined && { active }) },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await prisma.keyword.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
