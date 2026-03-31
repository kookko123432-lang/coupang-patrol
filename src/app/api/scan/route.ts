import { NextResponse } from 'next/server'
import { getPosts } from '@/lib/post-store'

export async function GET() {
  const posts = await getPosts()
  return NextResponse.json(posts)
}

export async function POST() {
  return NextResponse.json({
    message: '掃描器在 GitHub Actions 上每小時自動運行',
    manualTrigger: 'https://github.com/kookko123432-lang/coupang-patrol/actions',
    postsAvailable: (await getPosts()).length,
  })
}
