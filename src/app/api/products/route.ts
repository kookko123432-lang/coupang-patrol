import { NextRequest, NextResponse } from 'next/server'
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/product-store'

export async function GET() {
  return NextResponse.json(await getProducts())
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, affiliateUrl, category } = await req.json()
    if (!name || !affiliateUrl) return NextResponse.json({ error: '名稱和連結為必填' }, { status: 400 })
    const product = await addProduct({ name, description, affiliateUrl, category })
    return NextResponse.json(product)
  } catch { return NextResponse.json({ error: '建立失敗' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    const updated = await updateProduct(id, data)
    if (!updated) return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    const ok = await deleteProduct(id)
    if (!ok) return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }) }
}
