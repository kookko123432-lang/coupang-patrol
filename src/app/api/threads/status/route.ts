import { NextResponse } from 'next/server'
import { getProfile, getQuota, getMyPosts, isTokenConfigured, getToken } from '@/lib/threads-api'

export async function GET() {
  // Quick check if any token is available
  const token = await getToken()
  if (!token) {
    return NextResponse.json({ connected: false, error: '未設定 Token' })
  }

  try {
    const [profile, quota, recentPosts] = await Promise.all([
      getProfile().catch(() => null),
      getQuota().catch(() => null),
      getMyPosts(3).catch(() => []),
    ])

    if (!profile) {
      return NextResponse.json({ connected: false, error: 'Token 已過期，請重新連結' })
    }

    return NextResponse.json({
      connected: true,
      profile,
      quota: quota ? {
        used: quota.quota_usage,
        total: quota.config?.quota_total || 250,
        resetInHours: Math.round((quota.config?.quota_duration || 86400) / 3600),
      } : null,
      recentPosts,
    })
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message })
  }
}
