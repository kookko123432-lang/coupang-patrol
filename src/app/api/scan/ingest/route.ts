import { NextRequest, NextResponse } from 'next/server'
import { addPosts } from '@/lib/post-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Support both { posts: [...] } and plain array from Threads scanner
    // Also support { posts: [...] } from X scanner
    const rawPosts = Array.isArray(body) ? body : body.posts
    if (!rawPosts || !Array.isArray(rawPosts)) {
      return NextResponse.json({ error: 'No posts array' }, { status: 400 })
    }

    // Normalize: Threads scanner sends flat objects, X scanner wraps in { posts }
    const result = await addPosts(rawPosts)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
