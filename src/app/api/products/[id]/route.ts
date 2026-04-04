import { NextRequest, NextResponse } from 'next/server'
import { updateProduct } from '@/lib/product-store'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()
    const updated = await updateProduct(params.id, data)
    if (!updated) return NextResponse.json({ error: '找不到商品' }, { status: 404 })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}
