'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Zap, Send, MessageSquare, ExternalLink, RefreshCw, AlertTriangle, Plus } from 'lucide-react'

interface AccountsData {
  threads: {
    connected: boolean
    profile?: { id: string; username: string; name: string }
    quota?: { used: number; total: number; resetInHours: number }
    recentPosts?: any[]
    error?: string
  }
  twitter: { connected: boolean; note?: string }
  instagram: { connected: boolean; note?: string }
}

export default function AccountsPage() {
  const [data, setData] = useState<AccountsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await fetch('/api/accounts')
      const d = await res.json()
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAccounts() }, [])

  async function handleTestPost() {
    setTesting(true)
    setTestResult('')
    try {
      const res = await fetch('/api/accounts/test-post', { method: 'POST' })
      const d = await res.json()
      if (d.ok) {
        setTestResult(`✅ 測試發文成功！Post ID: ${d.postId}`)
        loadAccounts()
      } else {
        setTestResult(`❌ 發文失敗：${d.error}`)
      }
    } catch (e: any) {
      setTestResult(`❌ 請求失敗：${e.message}`)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="h-48 bg-gray-800 rounded-xl" />
          <div className="h-48 bg-gray-800 rounded-xl" />
        </div>
      </div>
    )
  }

  const threads = data?.threads
  const twitter = data?.twitter
  const instagram = data?.instagram

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">社群帳號管理</h1>
        <p className="text-gray-400 mt-1 text-sm">管理你的社群媒體連結與發布權限</p>
      </div>

      {testResult && (
        <div className={`px-4 py-3 rounded-lg text-sm ${testResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {testResult}
        </div>
      )}

      {/* ─── Threads ─── */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">Th</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Threads</h2>
              <p className="text-xs text-gray-500">Meta Threads 帳號</p>
            </div>
          </div>
          {threads?.connected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />已連結
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm font-medium">
              <XCircle className="w-4 h-4" />未連結
            </span>
          )}
        </div>

        {threads?.connected ? (
          <div className="p-5 space-y-4">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
                {threads.profile?.name?.[0] || '?'}
              </div>
              <div>
                <div className="text-lg font-medium text-gray-100">{threads.profile?.name}</div>
                <div className="text-sm text-gray-400">@{threads.profile?.username}</div>
                <div className="text-xs text-gray-600">ID: {threads.profile?.id}</div>
              </div>
            </div>

            {/* Quota */}
            {threads.quota && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">今日發布配額</span>
                  <span className="text-sm font-medium text-gray-200">{threads.quota.used} / {threads.quota.total}</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${threads.quota.used / threads.quota.total > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((threads.quota.used / threads.quota.total) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">每 {threads.quota.resetInHours} 小時重置</div>
              </div>
            )}

            {/* Recent Posts */}
            {threads.recentPosts && threads.recentPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">最近的貼文</h3>
                <div className="space-y-2">
                  {threads.recentPosts.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-sm text-gray-300 line-clamp-2">{post.text || '(無文字內容)'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span>{post.media_type}</span>
                        <span>{new Date(post.timestamp).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleTestPost}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {testing ? '發布中...' : '測試發文'}
              </button>
              <a
                href={`https://www.threads.net/@${threads.profile?.username}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                查看 Threads
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">Threads 帳號尚未連結</p>
            <p className="text-gray-600 text-sm mb-4">{threads?.error || '請透過 OAuth 授權連結你的 Threads 帳號'}</p>
            <a
              href="/api/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              連結 Threads
            </a>
          </div>
        )}
      </div>

      {/* ─── X / Twitter ─── */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden opacity-60">
        <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm">X</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">X / Twitter</h2>
              <p className="text-xs text-gray-500">推廣 Amazon 商品</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-sm">即將開放</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">X/Twitter 整合正在開發中</p>
          <p className="text-gray-600 text-xs mt-1">將支援自動搜尋推文 → AI 文案 → 推廣 Amazon Associates 連結</p>
        </div>
      </div>

      {/* ─── Instagram ─── */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden opacity-60">
        <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">IG</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Instagram</h2>
              <p className="text-xs text-gray-500">推廣蝦皮 / 酷澎商品</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-sm">即將開放</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">Instagram 整合正在開發中</p>
          <p className="text-gray-600 text-xs mt-1">將支援限動/貼文推廣 → 蝦皮/酷澎分潤連結</p>
        </div>
      </div>
    </div>
  )
}
