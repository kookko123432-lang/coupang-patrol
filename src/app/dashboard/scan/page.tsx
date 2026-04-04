'use client'

import { useEffect, useState } from 'react'
import { Search, RefreshCw, Sparkles, Send, SkipForward, ExternalLink, Clock, Heart, MessageCircle, LogIn } from 'lucide-react'
import { useAccount } from '@/lib/account-context'

interface ScanPost {
  id: string
  threadsPostId: string
  authorName: string
  content: string
  likeCount: number
  replyCount: number
  keyword: string
  url: string
  scannedAt: string
  status: string
  platform?: string
  accountId?: string
  reply?: { content: string; status: string }
}

export default function ScanPage() {
  const { selectedAccount, accounts } = useAccount()
  const [posts, setPosts] = useState<ScanPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<ScanPost | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/scan')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPosts() }, [])

  // Filter posts by selected account
  const filteredPosts = selectedAccount
    ? posts.filter(p => {
        // Match by accountId if present, otherwise by platform
        if (p.accountId) return p.accountId === selectedAccount.id
        if (p.platform) return p.platform === selectedAccount.platform
        // Legacy posts without account info: show for threads accounts
        return selectedAccount.platform === 'threads'
      })
    : []

  async function generateReply(post: ScanPost) {
    setGenerating(true)
    setMessage('')
    try {
      const res = await fetch('/api/replies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scannedPostId: post.id,
          postContent: post.content,
          authorName: post.authorName,
          productInfo: '酷澎好物推薦',
        }),
      })
      const data = await res.json()
      if (data.content) {
        setReplyContent(data.content)
        setSelectedPost(post)
      } else {
        setMessage('生成失敗，請手動撰寫回覆')
        setReplyContent('')
        setSelectedPost(post)
      }
    } catch {
      setMessage('AI 生成失敗，請手動撰寫')
      setReplyContent('')
      setSelectedPost(post)
    } finally {
      setGenerating(false)
    }
  }

  async function publishReply() {
    if (!selectedPost || !replyContent || !selectedAccount) return
    setPublishing(true)
    try {
      const res = await fetch('/api/replies/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          threadsPostId: selectedPost.threadsPostId,
          authorName: selectedPost.authorName,
          replyId: selectedPost.id,
          accountId: selectedAccount.id,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage('✅ 已成功發布！')
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, status: 'replied' } : p))
        setSelectedPost(null)
        setReplyContent('')
      } else {
        setMessage(`❌ 發布失敗：${data.error || data.message}`)
      }
    } catch (e: any) {
      setMessage(`❌ 發布失敗：${e.message}`)
    } finally {
      setPublishing(false)
    }
  }

  function skipPost(post: ScanPost) {
    setPosts(posts.map(p => p.id === post.id ? { ...p, status: 'skipped' } : p))
    if (selectedPost?.id === post.id) {
      setSelectedPost(null)
      setReplyContent('')
    }
  }

  const newPosts = filteredPosts.filter(p => p.status === 'new')
  const repliedPosts = filteredPosts.filter(p => p.status === 'replied')
  const skippedPosts = filteredPosts.filter(p => p.status === 'skipped')

  // No account selected
  if (!selectedAccount && accounts.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <LogIn className="w-10 h-10 mb-4 text-gray-600" />
        <p className="text-lg">請先在上方選擇一個帳號</p>
        <p className="text-sm text-gray-600 mt-1">選擇帳號後即可查看該帳號的掃描結果</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <LogIn className="w-10 h-10 mb-4 text-gray-600" />
        <p className="text-lg">尚未連結任何帳號</p>
        <a href="/dashboard/accounts" className="text-blue-400 hover:underline mt-2">前往連結帳號 →</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">掃描結果</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {selectedAccount ? `@${selectedAccount.username} 的掃描結果` : '本地掃描器搜尋到的貼文'}
          </p>
        </div>
        <button onClick={loadPosts} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新載入
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '待處理', count: newPosts.length, color: 'text-blue-400' },
          { label: '已回覆', count: repliedPosts.length, color: 'text-emerald-400' },
          { label: '已跳過', count: skippedPosts.length, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Post List */}
        <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
          {newPosts.length === 0 && (
            <div className="bg-gray-900/30 border border-gray-800/30 rounded-xl p-8 text-center">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {filteredPosts.length === 0 && posts.length > 0
                  ? '此帳號尚無掃描結果（切換帳號試試）'
                  : '尚無掃描結果'}
              </p>
              <p className="text-gray-600 text-xs mt-1">GitHub Actions 會自動執行掃描</p>
            </div>
          )}
          {newPosts.map(post => (
            <div key={post.id}
              className={`bg-gray-900/50 border rounded-xl p-4 cursor-pointer transition-colors ${
                selectedPost?.id === post.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800/50 hover:border-gray-700'
              }`}
              onClick={() => { setSelectedPost(post); setReplyContent('') }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">@{post.authorName}</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.replyCount}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{post.keyword}</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-3">{post.content}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {new Date(post.scannedAt).toLocaleString('zh-TW')}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Panel */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 sticky top-0">
          {selectedPost ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">原始貼文 — @{selectedPost.authorName}</h3>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-200">{selectedPost.content}</p>
                </div>
                {selectedPost.url && (
                  <a href={selectedPost.url} target="_blank" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:underline">
                    <ExternalLink className="w-3 h-3" />查看原文
                  </a>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">
                    以 <span className="text-blue-400">@{selectedAccount?.username}</span> 回覆
                  </h3>
                  <button onClick={() => generateReply(selectedPost)} disabled={generating}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs text-white">
                    <Sparkles className={`w-3 h-3 ${generating ? 'animate-pulse' : ''}`} />
                    {generating ? 'AI 生成中...' : 'AI 生成回覆'}
                  </button>
                </div>
                <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
                  placeholder="輸入回覆內容，或點擊「AI 生成回覆」自動生成..."
                  className="w-full h-40 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500/50" />
              </div>

              <div className="flex gap-3">
                <button onClick={publishReply} disabled={publishing || !replyContent}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium">
                  <Send className="w-4 h-4" />
                  {publishing ? '發布中...' : `以 @${selectedAccount?.username} 發布`}
                </button>
                <button onClick={() => skipPost(selectedPost)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300">
                  <SkipForward className="w-4 h-4" />
                  跳過
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              選擇左邊的貼文來撰寫回覆
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
