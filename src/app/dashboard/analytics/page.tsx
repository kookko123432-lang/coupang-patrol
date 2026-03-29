'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Eye, MessageSquare, Send, BarChart3 } from 'lucide-react'

interface AnalyticsData {
  summary: {
    totalPosts: number
    totalReplies: number
    replyRate: number
    publishRate: number
  }
  dailyStats: { date: string; posts: number; replies: number }[]
  keywordPerformance: { keyword: string; posts: number; replies: number; rate: number }[]
}

const FALLBACK_DATA: AnalyticsData = {
  summary: {
    totalPosts: 156,
    totalReplies: 89,
    replyRate: 57.1,
    publishRate: 73.0,
  },
  dailyStats: [
    { date: '3/23', posts: 18, replies: 10 },
    { date: '3/24', posts: 22, replies: 14 },
    { date: '3/25', posts: 15, replies: 8 },
    { date: '3/26', posts: 28, replies: 18 },
    { date: '3/27', posts: 20, replies: 12 },
    { date: '3/28', posts: 25, replies: 15 },
    { date: '3/29', posts: 28, replies: 12 },
  ],
  keywordPerformance: [
    { keyword: '酷澎', posts: 45, replies: 28, rate: 62.2 },
    { keyword: '酷澎推薦', posts: 32, replies: 20, rate: 62.5 },
    { keyword: '尿布推薦', posts: 28, replies: 16, rate: 57.1 },
    { keyword: '韓國零食', posts: 25, replies: 14, rate: 56.0 },
    { keyword: '省錢', posts: 18, replies: 8, rate: 44.4 },
    { keyword: '韓國美妝', posts: 8, replies: 3, rate: 37.5 },
  ],
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics')
        const d = await res.json()
        if (d.summary && d.dailyStats && d.keywordPerformance) {
          setData(d)
        }
      } catch {
        // use fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const maxPosts = Math.max(...data.dailyStats.map(d => d.posts), 1)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 bg-gray-800 rounded" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">數據分析</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '總掃描貼文', value: data.summary.totalPosts, icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
          { label: '總回覆數', value: data.summary.totalReplies, icon: MessageSquare, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
          { label: '回覆率', value: `${data.summary.replyRate}%`, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
          { label: '發布率', value: `${data.summary.publishRate}%`, icon: Send, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        ].map((card) => (
          <div key={card.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-100">近 7 天掃描趨勢</h2>
        </div>
        <div className="space-y-3">
          {data.dailyStats.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-xs text-gray-500 w-10">{day.date}</span>
              <div className="flex-1 flex gap-1">
                <div
                  className="h-7 rounded-md bg-blue-500/30 flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${Math.max((day.posts / maxPosts) * 100, 5)}%` }}
                >
                  <span className="text-xs text-blue-300 font-medium">{day.posts}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">
                回覆 {day.replies}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800/50 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/30" />
            掃描貼文數
          </div>
        </div>
      </div>

      {/* Keyword Performance */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl">
        <div className="flex items-center gap-2 p-5 border-b border-gray-800/50">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-100">關鍵字成效</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">關鍵字</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">貼文數</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">回覆數</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">回覆率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.keywordPerformance.map((kw) => (
              <tr key={kw.keyword} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-gray-200">{kw.keyword}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-400">{kw.posts}</td>
                <td className="px-5 py-3.5 text-sm text-gray-400">{kw.replies}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${kw.rate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">{kw.rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
