import { NextResponse } from 'next/server'
import { getPosts } from '@/lib/post-store'
import { getKeywords } from '@/lib/keyword-store'
import { getProducts } from '@/lib/product-store'

export async function GET() {
  const [posts, keywords, products] = await Promise.all([
    getPosts(),
    getKeywords(),
    getProducts(),
  ])

  const pendingReplies = posts.filter((p: any) => p.status === 'new').length
  const publishedReplies = posts.filter((p: any) => p.status === 'replied').length

  return NextResponse.json({
    stats: {
      keywordCount: keywords.length,
      productCount: products.length,
      todayScans: posts.length,
      pendingReplies,
      publishedReplies,
    },
    activities: posts.slice(0, 5).map((p: any) => ({
      id: p.id,
      type: 'scan',
      message: `掃描到 @${p.authorName} 的貼文 (${p.keyword})`,
      time: getTimeAgo(p.scannedAt),
    })),
  })
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '剛剛'
  if (mins < 60) return `${mins} 分鐘前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小時前`
  return `${Math.floor(hours / 24)} 天前`
}
