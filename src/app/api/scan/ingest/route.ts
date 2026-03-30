import { NextRequest, NextResponse } from 'next/server'
import { addPosts, getPosts } from '@/lib/post-store'

export async function POST(req: NextRequest) {
  try {
    const { posts } = await req.json()
    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: 'No posts' }, { status: 400 })
    }
    const result = addPosts(posts)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(getPosts())
}
