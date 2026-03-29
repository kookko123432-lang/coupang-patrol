import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    const keywordCount = await prisma.keyword.count({
      where: { userId: DEMO_USER_ID },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayScans = await prisma.scannedPost.count({
      where: {
        userId: DEMO_USER_ID,
        scannedAt: { gte: today },
      },
    })

    const pendingReplies = await prisma.generatedReply.count({
      where: { userId: DEMO_USER_ID, status: 'pending' },
    })

    const publishedReplies = await prisma.generatedReply.count({
      where: { userId: DEMO_USER_ID, status: 'published' },
    })

    const recentScanLogs = await prisma.scanLog.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { startedAt: 'desc' },
      take: 5,
    })

    const activities = [
      ...recentScanLogs.map((log) => ({
        id: log.id,
        type: 'scan',
        message: `掃描完成：找到 ${log.postsFound} 篇相關貼文`,
        time: getTimeAgo(log.startedAt),
      })),
    ]

    return NextResponse.json({
      stats: { keywordCount, todayScans, pendingReplies, publishedReplies },
      activities: activities.length > 0 ? activities : [
        { id: '1', type: 'scan', message: '掃描完成：找到 5 篇相關貼文', time: '2 分鐘前' },
        { id: '2', type: 'reply', message: 'AI 已生成 3 則回覆文案', time: '5 分鐘前' },
        { id: '3', type: 'publish', message: '已發布回覆至 @小美的生活日記', time: '15 分鐘前' },
        { id: '4', type: 'scan', message: '掃描完成：找到 2 篇相關貼文', time: '30 分鐘前' },
        { id: '5', type: 'reply', message: 'AI 已生成 2 則回覆文案', time: '35 分鐘前' },
      ],
    })
  } catch (error) {
    return NextResponse.json({
      stats: { keywordCount: 6, todayScans: 23, pendingReplies: 8, publishedReplies: 15 },
      activities: [
        { id: '1', type: 'scan', message: '掃描完成：找到 5 篇相關貼文', time: '2 分鐘前' },
        { id: '2', type: 'reply', message: 'AI 已生成 3 則回覆文案', time: '5 分鐘前' },
        { id: '3', type: 'publish', message: '已發布回覆至 @小美的生活日記', time: '15 分鐘前' },
        { id: '4', type: 'scan', message: '掃描完成：找到 2 篇相關貼文', time: '30 分鐘前' },
        { id: '5', type: 'reply', message: 'AI 已生成 2 則回覆文案', time: '35 分鐘前' },
      ],
    })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小時前`
  return `${Math.floor(diffHour / 24)} 天前`
}
