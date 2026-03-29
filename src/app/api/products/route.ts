import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, affiliateUrl, category } = await req.json()
    if (!name || !affiliateUrl) return NextResponse.json({ error: '名稱和連結為必填' }, { status: 400 })

    const created = await prisma.product.create({
      data: { userId: DEMO_USER_ID, name, description, affiliateUrl, category },
    })
    return NextResponse.json(created)
  } catch {
    return NextResponse.json({ error: '建立失敗' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, affiliateUrl, category, active } = await req.json()
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(affiliateUrl !== undefined && { affiliateUrl }),
        ...(category !== undefined && { category }),
        ...(active !== undefined && { active }),
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
