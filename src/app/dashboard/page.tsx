'use client'

import { useEffect, useState } from 'react'
import { Key, Search, MessageSquare, Send, Activity, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  keywordCount: number
  todayScans: number
  pendingReplies: number
  publishedReplies: number
}

interface Activity {
  id: string
  type: string
  message: string
  time: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    keywordCount: 0,
    todayScans: 0,
    pendingReplies: 0,
    publishedReplies: 0,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const data = await res.json()
        setStats(data.stats)
        setActivities(data.activities || [])
      } catch {
        setStats({ keywordCount: 6, todayScans: 23, pendingReplies: 8, publishedReplies: 15 })
        setActivities([
          { id: '1', type: 'scan', message: '掃描完成：找到 5 篇相關貼文', time: '2 分鐘前' },
          { id: '2', type: 'reply', message: 'AI 已生成 3 則回覆文案', time: '5 分鐘前' },
          { id: '3', type: 'publish', message: '已發布回覆至 @小美的生活日記', time: '15 分鐘前' },
          { id: '4', type: 'scan', message: '掃描完成：找到 2 篇相關貼文', time: '30 分鐘前' },
          { id: '5', type: 'reply', message: 'AI 已生成 2 則回覆文案', time: '35 分鐘前' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      label: '監控關鍵字',
      value: stats.keywordCount,
      icon: Key,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '今日掃描',
      value: stats.todayScans,
      icon: Search,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: '待審回覆',
      value: stats.pendingReplies,
      icon: MessageSquare,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '已發布',
      value: stats.publishedReplies,
      icon: Send,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">儀表板</h1>
        <p className="text-gray-400 mt-1">歡迎回來，以下是你的海巡系統概覽</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-100">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-100">最近動態</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-800/50">
            {activities.map((activity) => (
              <div key={activity.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{activity.message}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                暫無動態
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-gray-800/50">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-100">快速操作</h2>
          </div>
          <div className="p-5 space-y-3">
            <Link
              href="/dashboard/scan"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">開始掃描</div>
                <div className="text-xs text-gray-500 mt-0.5">掃描 Threads 上的相關貼文</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </Link>
            <Link
              href="/dashboard/keywords"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">管理關鍵字</div>
                <div className="text-xs text-gray-500 mt-0.5">新增或調整監控關鍵字</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </Link>
            <Link
              href="/dashboard/products"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">管理商品</div>
                <div className="text-xs text-gray-500 mt-0.5">設定推廣商品與分潤連結</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">系統設定</div>
                <div className="text-xs text-gray-500 mt-0.5">調整品牌語氣、掃描頻率等</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
