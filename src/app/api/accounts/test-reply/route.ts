import { NextResponse } from 'next/server'
import { replyToPost } from '@/lib/threads-api'

export async function POST(req: Request) {
  try {
    const { postId, text } = await req.json()
    if (!postId || !text) {
      return NextResponse.json({ ok: false, error: '缺少 postId 或 text' }, { status: 400 })
    }
    const id = await replyToPost(postId, text)
    return NextResponse.json({ ok: true, replyId: id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
