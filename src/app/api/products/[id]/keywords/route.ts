import { NextRequest, NextResponse } from 'next/server'
import { addKeyword, deleteKeyword } from '@/lib/product-store'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { text } = await req.json()
    const productId = params.id
    if (!text) return NextResponse.json({ error: '缺少關鍵字' }, { status: 400 })
    const kw = await addKeyword(productId, text)
    if (!kw) return NextResponse.json({ error: '關鍵字已存在' }, { status: 409 })
    return NextResponse.json(kw)
  } catch { return NextResponse.json({ error: '建立失敗' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { keywordId } = await req.json()
    if (!keywordId) return NextResponse.json({ error: '缺少 keywordId' }, { status: 400 })
    const ok = await deleteKeyword(params.id, keywordId)
    if (!ok) return NextResponse.json({ error: '找不到' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }) }
}
