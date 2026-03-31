import { NextResponse } from 'next/server'
import { publishPost } from '@/lib/threads-api'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    const content = text || '🤖 測試發文 — Coupang Patrol 系統測試中，請忽略'
    const postId = await publishPost(content)
    return NextResponse.json({ ok: true, postId, content })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
