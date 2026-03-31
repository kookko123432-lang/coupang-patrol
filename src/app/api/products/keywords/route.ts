import { NextRequest, NextResponse } from 'next/server'
import { getProducts, addKeyword, updateKeyword, deleteKeyword } from '@/lib/product-store'

export async function POST(req: NextRequest) {
  try {
    const { productId, text } = await req.json()
    if (!productId || !text) return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    const kw = await addKeyword(productId, text)
    if (!kw) return NextResponse.json({ error: '關鍵字已存在' }, { status: 409 })
    return NextResponse.json(kw)
  } catch { return NextResponse.json({ error: '建立失敗' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const { productId, keywordId, ...data } = await req.json()
    if (!productId || !keywordId) return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    const updated = await updateKeyword(productId, keywordId, data)
    if (!updated) return NextResponse.json({ error: '找不到' }, { status: 404 })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const { productId, keywordId } = await req.json()
    if (!productId || !keywordId) return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    const ok = await deleteKeyword(productId, keywordId)
    if (!ok) return NextResponse.json({ error: '找不到' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }) }
}
