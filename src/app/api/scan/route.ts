import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateMockPosts } from '@/lib/mock-scanner'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    const posts = await prisma.scannedPost.findMany({
      where: { userId: DEMO_USER_ID },
      include: { reply: true, keyword: true },
      orderBy: { scannedAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST() {
  try {
    const keywords = await prisma.keyword.findMany({
      where: { userId: DEMO_USER_ID, active: true },
    })

    if (keywords.length === 0) {
      return NextResponse.json({ error: '請先新增至少一個監控關鍵字' }, { status: 400 })
    }

    const scanLog = await prisma.scanLog.create({
      data: { userId: DEMO_USER_ID, status: 'running' },
    })

    let totalFound = 0
    for (const kw of keywords) {
      const mockPosts = generateMockPosts(2 + Math.floor(Math.random() * 3))

      for (const post of mockPosts) {
        try {
          await prisma.scannedPost.create({
            data: {
              userId: DEMO_USER_ID,
              keywordId: kw.id,
              threadsPostId: post.threadsPostId,
              authorName: post.authorName,
              content: post.content,
              likeCount: post.likeCount,
              replyCount: post.replyCount,
            },
          })
          totalFound++
        } catch {
          // duplicate post, skip
        }
      }

      await prisma.keyword.update({
        where: { id: kw.id },
        data: { scanCount: { increment: totalFound } },
      })
    }

    await prisma.scanLog.update({
      where: { id: scanLog.id },
      data: { status: 'completed', postsFound: totalFound, completedAt: new Date() },
    })

    return NextResponse.json({ found: totalFound })
  } catch (e) {
    return NextResponse.json({ error: '掃描失敗' }, { status: 500 })
  }
}
