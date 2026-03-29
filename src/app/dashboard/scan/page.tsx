'use client'

import { useEffect, useState } from 'react'
import { Play, Sparkles, Check, X, Eye, Heart, MessageCircle, Loader2 } from 'lucide-react'

interface ScannedPost {
  id: string
  threadsPostId: string
  authorName: string
  content: string
  keyword: string
  likeCount: number
  replyCount: number
  scannedAt: string
  reply?: {
    id: string
    content: string
    status: string
  } | null
}

export default function ScanPage() {
  const [posts, setPosts] = useState<ScannedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  async function fetchPosts() {
    try {
      const res = await fetch('/api/scan/results')
      const data = await res.json()
      setPosts(data)
    } catch {
      setPosts([
        {
          id: '1', threadsPostId: 'tp1', authorName: '小美的生活日記',
          content: '最近想買一些韓國零食，有人可以推薦嗎？聽說酷澎上面很多選擇',
          keyword: '韓國零食', likeCount: 42, replyCount: 8, scannedAt: new Date().toISOString(),
          reply: { id: 'r1', content: '哈囉！推薦你試試看農心辛拉面跟韓國海苔，我都透過酷澎買的，出貨超快！可以參考看看 https://www.coupang.com/p2', status: 'pending' },
        },
        {
          id: '2', threadsPostId: 'tp2', authorName: '省钱媽媽',
          content: '尿布真的好貴...有人知道哪裡買比較便宜嗎？酷澎的價格如何？',
          keyword: '尿布推薦', likeCount: 78, replyCount: 15, scannedAt: new Date().toISOString(),
          reply: null,
        },
        {
          id: '3', threadsPostId: 'tp3', authorName: '韓國代購達人',
          content: '求推薦韓國保養品！之前去首爾買的都用完了，想在網路上回購',
          keyword: '韓國美妝', likeCount: 56, replyCount: 12, scannedAt: new Date().toISOString(),
          reply: { id: 'r3', content: '我之前也去首爾掃貨！後來發現雪花秀潤燥精華在酷澎就買得到了，價格差不多還免運～可以看看這邊 https://www.coupang.com/p3', status: 'pending' },
        },
        {
          id: '4', threadsPostId: 'tp4', authorName: '台北美食客',
          content: '韓國泡麵哪個牌子最好吃？想買一箱來試試，朋友推薦辛拉面',
          keyword: '韓國零食', likeCount: 33, replyCount: 6, scannedAt: new Date().toISOString(),
          reply: null,
        },
        {
          id: '5', threadsPostId: 'tp5', authorName: '居家生活美學',
          content: '最近在酷澎看到很多韓國生活用品，有人買過嗎？品質怎麼樣？',
          keyword: '酷澎', likeCount: 91, replyCount: 22, scannedAt: new Date().toISOString(),
          reply: { id: 'r5', content: '買過！韓國的收納用品設計都很有質感，價格也合理。推薦 LG 的洗衣精，天然成分很溫和 https://www.coupang.com/p4', status: 'published' },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  async function handleScan() {
    setScanning(true)
    try {
      await fetch('/api/scan/start', { method: 'POST' })
    } catch {
      // mock scan - add a new post
    }
    await new Promise((r) => setTimeout(r, 1500))
    setScanning(false)
    fetchPosts()
  }

  async function handleGenerate(postId: string) {
    setGeneratingId(postId)
    try {
      const res = await fetch('/api/replies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, reply: { id: data.id || 'new', content: data.content, status: 'pending' } } : p
        )
      )
    } catch {
      // fallback mock
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reply: {
                  id: `r_${Date.now()}`,
                  content: `推一個！最近剛好在用相關產品，真的覺得CP值很高，品質很不錯～有需要可以看看酷澎，出貨很快的 https://www.coupang.com/demo`,
                  status: 'pending',
                },
              }
            : p
        )
      )
    }
    setGeneratingId(null)
  }

  async function handleApprove(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.reply) return

    try {
      await fetch('/api/replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.reply.id, status: 'approved' }),
      })
    } catch {
      // fallback
    }

    await handlePublish(postId)
  }

  async function handlePublish(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.reply) return

    try {
      await fetch('/api/replies/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyId: post.reply.id }),
      })
    } catch {
      // fallback
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId && p.reply
          ? { ...p, reply: { ...p.reply, status: 'published' } }
          : p
      )
    )
  }

  async function handleSkip(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.reply) return

    try {
      await fetch('/api/replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.reply.id, status: 'rejected' }),
      })
    } catch {
      // fallback
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId && p.reply
          ? { ...p, reply: { ...p.reply, status: 'rejected' } }
          : p
      )
    )
  }

  function handleEditStart(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.reply) return
    setEditingReply(postId)
    setEditContent(post.reply.content)
  }

  async function handleEditSave(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.reply) return

    try {
      await fetch('/api/replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.reply.id, content: editContent }),
      })
    } catch {
      // fallback
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId && p.reply
          ? { ...p, reply: { ...p.reply, content: editContent } }
          : p
      )
    )
    setEditingReply(null)
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400',
      approved: 'bg-blue-500/10 text-blue-400',
      published: 'bg-emerald-500/10 text-emerald-400',
      rejected: 'bg-gray-700/50 text-gray-400',
    }
    const labels: Record<string, string> = {
      pending: '待審核',
      approved: '已核准',
      published: '已發布',
      rejected: '已跳過',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">掃描結果</h1>
          <p className="text-gray-400 mt-1">查看掃描到的 Threads 貼文與 AI 回覆</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              掃描中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              開始掃描
            </>
          )}
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-5 w-32 bg-gray-800 rounded mb-3" />
              <div className="h-4 w-full bg-gray-800 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-800 rounded" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">尚未掃描到任何貼文</p>
            <button
              onClick={handleScan}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              開始第一次掃描
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-colors"
            >
              {/* Post header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{post.authorName}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        {post.keyword}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {post.replyCount}
                      </span>
                    </div>
                  </div>
                </div>
                {post.reply && statusBadge(post.reply.status)}
              </div>

              {/* Post content */}
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{post.content}</p>

              {/* Reply section */}
              {post.reply ? (
                <div className="mt-4 border-t border-gray-800/50 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">AI 回覆</span>
                  </div>
                  {editingReply === post.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(post.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => setEditingReply(null)}
                          className="px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400 leading-relaxed bg-gray-800/30 rounded-lg px-4 py-3 mb-3">
                        {post.reply.content}
                      </p>
                      {post.reply.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            核准並發布
                          </button>
                          <button
                            onClick={() => handleEditStart(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleSkip(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-400 text-xs transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            跳過
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-4 border-t border-gray-800/50 pt-4">
                  <button
                    onClick={() => handleGenerate(post.id)}
                    disabled={generatingId === post.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generatingId === post.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI 生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        生成 AI 回覆
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
