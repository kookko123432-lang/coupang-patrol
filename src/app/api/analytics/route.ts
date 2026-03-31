import { NextResponse } from 'next/server'
import { getPosts } from '@/lib/post-store'

export async function GET() {
  const posts = await getPosts()
  const now = new Date()

  const keywordMap = new Map<string, { posts: number; replied: number }>()
  let totalPosts = 0
  let replied = 0

  const dailyData: { date: string; posts: number; replies: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dailyData.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, posts: 0, replies: 0 })
  }

  for (const post of posts) {
    totalPosts++
    if ((post as any).status === 'replied') replied++

    const kw = (post as any).keyword || 'unknown'
    const current = keywordMap.get(kw) || { posts: 0, replied: 0 }
    current.posts++
    if ((post as any).status === 'replied') current.replied++
    keywordMap.set(kw, current)

    const postDate = new Date((post as any).scannedAt)
    const dayDiff = Math.floor((now.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000))
    if (dayDiff >= 0 && dayDiff < 7) {
      dailyData[6 - dayDiff].posts++
      if ((post as any).status === 'replied') dailyData[6 - dayDiff].replies++
    }
  }

  const keywordPerformance = Array.from(keywordMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      posts: data.posts,
      replies: data.replied,
      rate: data.posts > 0 ? Math.round((data.replied / data.posts) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.posts - a.posts)

  return NextResponse.json({
    summary: {
      totalPosts,
      totalReplies: replied,
      replyRate: totalPosts > 0 ? Math.round((replied / totalPosts) * 1000) / 10 : 0,
      publishRate: replied > 0 ? 100 : 0,
    },
    dailyStats: dailyData,
    keywordPerformance,
  })
}
