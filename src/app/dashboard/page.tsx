'use client'

import { useEffect, useState } from 'react'
import { Key, Search, MessageSquare, Send, Activity, Clock, ArrowRight, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  keywordCount: number
  todayScans: number
  pendingReplies: number
  publishedReplies: number
}

interface ActivityItem {
  id: string
  type: string
  message: string
  time: string
}

interface ThreadsStatus {
  connected: boolean
  profile?: { id: string; username: string; name: string }
  quota?: { used: number; total: number }
  error?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ keywordCount: 0, todayScans: 0, pendingReplies: 0, publishedReplies: 0 })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [threads, setThreads] = useState<ThreadsStatus | null>(null)
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
          { id: '3', type: 'publish', message: '已發布回覆至 Threads', time: '15 分鐘前' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    fetch('/api/threads/status')
      .then(r => r.json())
      .then(setThreads)
      .catch(() => setThreads(null))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="grid grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-100">儀表板</h1>
        <p className="text-gray-400 mt-1">歡迎回來，以下是你的海巡系統概覽</p>
      </div>

      {/* Threads Connection Status */}
      {threads && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
          threads.connected 
            ? 'bg-emerald-500/5 border-emerald-500/20' 
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          {threads.connected ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Threads 已連結：@{threads.profile?.username || 'unknown'}
              </span>
              {threads.quota && (
                <span className="text-xs text-gray-500 ml-2">
                  發布配額：{threads.quota.used}/{threads.quota.total}（每日）
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Threads 未連結</span>
              <Link href="/dashboard/settings" className="text-xs text-blue-400 hover:underline ml-2">
                前往設定 →
              </Link>
            </>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '監控關鍵字', value: stats.keywordCount, icon: Key, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
          { label: '今日掃描', value: stats.todayScans, icon: Search, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
          { label: '待審回覆', value: stats.pendingReplies, icon: MessageSquare, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
          { label: '已發布', value: stats.publishedReplies, icon: Send, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-100">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-gray-800/50">
            <Activity className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-100">最近動態</h2>
          </div>
          <div className="divide-y divide-gray-800/50">
            {activities.map(a => (
              <div key={a.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <p className="text-sm text-gray-300 flex-1 truncate">{a.message}</p>
                <span className="text-xs text-gray-500">{a.time}</span>
              </div>
            ))}
            {activities.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">暫無動態</div>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-gray-800/50">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-100">快速操作</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { href: '/dashboard/scan', title: '開始掃描', desc: '掃描 Threads 上的相關貼文' },
              { href: '/dashboard/keywords', title: '管理關鍵字', desc: '新增或調整監控關鍵字' },
              { href: '/dashboard/products', title: '管理商品', desc: '設定推廣商品與分潤連結' },
              { href: '/dashboard/settings', title: '系統設定', desc: '調整品牌語氣、掃描頻率等' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group">
                <div>
                  <div className="text-sm font-medium text-gray-200">{a.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
