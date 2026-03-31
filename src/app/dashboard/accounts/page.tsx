'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Send, ExternalLink, RefreshCw, AlertTriangle, Plus, Trash2, Zap, Users } from 'lucide-react'

interface Account {
  id: string
  platform: string
  username: string
  name: string
  connected: boolean
  quota?: { used: number; total: number }
  addedAt: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [threadsStatus, setThreadsStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState('')
  const [showAddThreads, setShowAddThreads] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [accRes, threadsRes] = await Promise.all([
        fetch('/api/accounts/list').then(r => r.json()),
        fetch('/api/threads/status').then(r => r.json()),
      ])
      setAccounts(accRes.accounts || [])
      setThreadsStatus(threadsRes)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleTestPost(accountId: string) {
    setTesting(accountId)
    setTestResult('')
    try {
      const res = await fetch('/api/accounts/test-post', { method: 'POST' })
      const d = await res.json()
      setTestResult(d.ok ? `✅ 測試發文成功！Post ID: ${d.postId}` : `❌ ${d.error}`)
      load()
    } catch (e: any) {
      setTestResult(`❌ ${e.message}`)
    }
    setTesting(null)
  }

  async function deleteAccount(id: string) {
    if (!confirm('確定要移除此帳號？')) return
    await fetch('/api/accounts/list', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  if (loading) {
    return (
      <div className="p-8"><div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded" />
        <div className="h-48 bg-gray-800 rounded-xl" />
      </div></div>
    )
  }

  const threadsAccounts = accounts.filter(a => a.platform === 'threads')
  const twitterAccounts = accounts.filter(a => a.platform === 'twitter')
  const instagramAccounts = accounts.filter(a => a.platform === 'instagram')

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">社群帳號管理</h1>
        <p className="text-gray-400 mt-1 text-sm">管理你的社群媒體帳號，每個平台可連結多個帳號</p>
      </div>

      {testResult && (
        <div className={`px-4 py-3 rounded-lg text-sm ${testResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {testResult}
        </div>
      )}

      {/* ─── Threads ─── */}
      <PlatformSection
        icon={<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">Th</div>}
        title="Threads"
        subtitle="Meta Threads 帳號"
        accounts={threadsAccounts}
        onTest={handleTestPost}
        onDelete={deleteAccount}
        testing={testing}
        threadsStatus={threadsStatus}
        onAdd={() => { window.location.href = '/api/auth/login' }}
        addLabel="連結 Threads 帳號"
      />

      {/* ─── X / Twitter ─── */}
      <PlatformSection
        icon={<div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm">X</div>}
        title="X / Twitter"
        subtitle="推廣 Amazon 商品"
        accounts={twitterAccounts}
        onTest={handleTestPost}
        onDelete={deleteAccount}
        testing={testing}
        disabled
        disabledNote="即將開放 — 搜尋推文 → 推廣 Amazon Associates 連結"
      />

      {/* ─── Instagram ─── */}
      <PlatformSection
        icon={<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">IG</div>}
        title="Instagram"
        subtitle="推廣蝦皮 / 酷澎商品"
        accounts={instagramAccounts}
        onTest={handleTestPost}
        onDelete={deleteAccount}
        testing={testing}
        disabled
        disabledNote="即將開放 — 限動/貼文推廣 → 蝦皮/酷澎分潤連結"
      />
    </div>
  )
}

function PlatformSection({ icon, title, subtitle, accounts, onTest, onDelete, testing, threadsStatus, onAdd, addLabel, disabled, disabledNote }: any) {
  const isConnected = accounts.length > 0

  return (
    <div className={`bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="text-xs text-gray-500">{accounts.length} 個帳號</span>
          )}
          {isConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />已連結
            </span>
          ) : disabled ? (
            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-sm">即將開放</span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm font-medium">
              <XCircle className="w-4 h-4" />未連結
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {disabled ? (
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">{disabledNote}</p>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Account Cards */}
          {accounts.map((account: Account) => (
            <div key={account.id} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                    {account.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-100">{account.name}</div>
                    <div className="text-sm text-gray-400">@{account.username}</div>
                  </div>
                </div>
                <button onClick={() => onDelete(account.id)} className="text-gray-600 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quota (for first Threads account) */}
              {threadsStatus?.quota && account.platform === 'threads' && (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">今日發布配額</span>
                    <span className="text-xs font-medium text-gray-300">{threadsStatus.quota.used}/{threadsStatus.quota.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${threadsStatus.quota.used / threadsStatus.quota.total > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((threadsStatus.quota.used / threadsStatus.quota.total) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => onTest(account.id)} disabled={testing === account.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md text-xs text-white">
                  {testing === account.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  測試發文
                </button>
                <a href={`https://www.threads.net/@${account.username}`} target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs text-gray-300">
                  <ExternalLink className="w-3 h-3" />查看
                </a>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {accounts.length === 0 && (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">尚未連結任何 {title} 帳號</p>
            </div>
          )}

          {/* Add Account Button */}
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {addLabel || `新增 ${title} 帳號`}
          </button>
        </div>
      )}
    </div>
  )
}
