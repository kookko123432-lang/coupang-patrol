import { NextResponse } from 'next/server'
import { isTokenConfigured, getProfile, getQuota, getMyPosts } from '@/lib/threads-api'

export async function GET() {
  if (!isTokenConfigured()) {
    return NextResponse.json({
      threads: { connected: false },
      twitter: { connected: false, note: '尚未開放' },
      instagram: { connected: false, note: '尚未開放' },
    })
  }

  try {
    const [profile, quota, recentPosts] = await Promise.all([
      getProfile().catch(() => null),
      getQuota().catch(() => null),
      getMyPosts(3).catch(() => []),
    ])

    return NextResponse.json({
      threads: {
        connected: true,
        profile,
        quota: quota ? {
          used: quota.quota_usage,
          total: quota.config.quota_total,
          resetInHours: Math.round(quota.config.quota_duration / 3600),
        } : null,
        recentPosts,
      },
      twitter: { connected: false, note: '尚未開放' },
      instagram: { connected: false, note: '尚未開放' },
    })
  } catch {
    return NextResponse.json({
      threads: { connected: false, error: 'Token 可能已過期' },
      twitter: { connected: false, note: '尚未開放' },
      instagram: { connected: false, note: '尚未開放' },
    })
  }
}
