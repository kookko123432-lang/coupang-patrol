import { NextResponse } from 'next/server'
import { getPosts } from '@/lib/post-store'

export async function GET() {
  const posts = getPosts()
  return NextResponse.json(posts)
}

export async function POST() {
  return NextResponse.json({
    message: '掃描器在 GitHub Actions 上每小時自動運行',
    manualCommand: 'gh workflow run scan.yml',
    postsAvailable: getPosts().length,
  })
}
