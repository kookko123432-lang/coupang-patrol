import { NextResponse } from 'next/server'

export async function GET() {
  const dailyStats = [
    { date: '3/23', posts: 18, replies: 10 },
    { date: '3/24', posts: 22, replies: 14 },
    { date: '3/25', posts: 15, replies: 8 },
    { date: '3/26', posts: 28, replies: 18 },
    { date: '3/27', posts: 20, replies: 12 },
    { date: '3/28', posts: 25, replies: 15 },
    { date: '3/29', posts: 28, replies: 12 },
  ]

  const keywordPerformance = [
    { keyword: '酷澎', posts: 45, replies: 28, rate: 62.2 },
    { keyword: '酷澎推薦', posts: 32, replies: 20, rate: 62.5 },
    { keyword: '尿布推薦', posts: 28, replies: 16, rate: 57.1 },
    { keyword: '韓國零食', posts: 25, replies: 14, rate: 56.0 },
    { keyword: '省錢', posts: 18, replies: 8, rate: 44.4 },
    { keyword: '韓國美妝', posts: 8, replies: 3, rate: 37.5 },
  ]

  const summary = {
    totalPosts: dailyStats.reduce((s, d) => s + d.posts, 0),
    totalReplies: dailyStats.reduce((s, d) => s + d.replies, 0),
    replyRate: 57.1,
    publishRate: 73.0,
  }

  return NextResponse.json({ summary, dailyStats, keywordPerformance })
}
