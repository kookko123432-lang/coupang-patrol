import { NextResponse } from 'next/server'
import { isTokenConfigured, getProfile, getQuota, getMyPosts } from '@/lib/threads-api'

export async function GET() {
  if (!isTokenConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'Threads API Token 未設定',
    })
  }

  try {
    const [profile, quota, recentPosts] = await Promise.all([
      getProfile().catch(() => null),
      getQuota().catch(() => null),
      getMyPosts(3).catch(() => []),
    ])

    return NextResponse.json({
      connected: true,
      profile,
      quota: quota ? {
        used: quota.quota_usage,
        total: quota.config.quota_total,
        resetIn: quota.config.quota_duration,
      } : null,
      recentPosts,
    })
  } catch (e: any) {
    return NextResponse.json({
      connected: false,
      error: e.message,
    })
  }
}
