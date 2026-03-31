import { NextRequest, NextResponse } from 'next/server'
import { getKeywords, addKeyword, updateKeyword, deleteKeyword } from '@/lib/keyword-store'

export async function GET() {
  return NextResponse.json(getKeywords())
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()
    if (!keyword) return NextResponse.json({ error: '關鍵字不能為空' }, { status: 400 })
    const kw = addKeyword(keyword)
    if (!kw) return NextResponse.json({ error: '關鍵字已存在' }, { status: 409 })
    return NextResponse.json(kw)
  } catch {
    return NextResponse.json({ error: '建立失敗' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    const updated = updateKeyword(id, data)
    if (!updated) return NextResponse.json({ error: '找不到關鍵字' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    const ok = deleteKeyword(id)
    if (!ok) return NextResponse.json({ error: '找不到關鍵字' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
