'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronRight, ExternalLink, Sparkles,
  Send, SkipForward, Heart, MessageCircle, Clock, RefreshCw,
  Package, Search, Link2, LogIn, Edit3, X, Check, Tag,
  Play, Timer, Zap, Radio
} from 'lucide-react'
import { useAccount } from '@/lib/account-context'

// ---- Types ----
interface ProductKeyword {
  id: string
  text: string
  scanEnabled: boolean
  scanInterval: number
  autoReply: boolean
}

interface Product {
  id: string
  name: string
  description: string
  affiliateUrl: string
  category: string
  active: boolean
  keywords: ProductKeyword[]
  accountId?: string
  createdAt: string
}

interface ScanPost {
  id: string
  platform: 'threads' | 'x' | 'twitter'
  platformPostId: string
  threadsPostId: string
  xPostId?: string
  authorName: string
  authorHandle?: string
  content: string
  likeCount: number
  replyCount: number
  repostCount?: number
  keyword: string
  url: string
  scannedAt: string
  status: string
  productId?: string
  accountId?: string
}

// ---- Main Page ----
export default function PatrolPage() {
  const { selectedAccount, accounts } = useAccount()

  const [products, setProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<ScanPost[]>([])
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<ScanPost | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [triggering, setTriggering] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')

  // New product form
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductUrl, setNewProductUrl] = useState('')

  // New keyword form
  const [newKeywordFor, setNewKeywordFor] = useState<string | null>(null)
  const [newKeywordText, setNewKeywordText] = useState('')

  // Editing product name
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editProductName, setEditProductName] = useState('')

  const loadData = useCallback(async () => {
    const [prodRes, postRes] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/scan').then(r => r.json()),
    ])
    setProducts(Array.isArray(prodRes) ? prodRes : prodRes.products || [])
    const allPosts = Array.isArray(postRes) ? postRes : []
    setPosts(allPosts)
    // Find latest scan time
    if (allPosts.length > 0) {
      const latest = allPosts.reduce((a: string, b: ScanPost) =>
        new Date(a).getTime() > new Date(b.scannedAt).getTime() ? a : b.scannedAt
      , allPosts[0].scannedAt)
      setLastScanTime(latest)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ---- Filter by selected account ----
  const accountProducts = selectedAccount
    ? products.filter(p => p.accountId === selectedAccount.id)
    : []

  // Show ALL scan results for this account's products + unclassified
  const accountPosts = selectedAccount ? posts : []

  // ---- Trigger Patrol ----
  async function triggerPatrol() {
    setTriggering(true)
    setScanStatus('running')
    setMessage('')
    try {
      const res = await fetch('/api/scan/trigger', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setScanStatus('done')
        setMessage('🚀 巡邏已啟動！掃描器正在背景執行，約 2-3 分鐘後結果會出現')
      } else {
        setScanStatus('error')
        setMessage(`❌ 啟動失敗：${data.error}`)
      }
    } catch (e: any) {
      setScanStatus('error')
      setMessage(`❌ ${e.message}`)
    } finally {
      setTriggering(false)
    }
  }

  // ---- Product CRUD ----
  async function addProduct() {
    if (!newProductName.trim() || !selectedAccount) return
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProductName,
        affiliateUrl: newProductUrl || '',
        description: '',
        accountId: selectedAccount.id,
      }),
    })
    setNewProductName('')
    setNewProductUrl('')
    setShowNewProduct(false)
    loadData()
  }

  async function deleteProduct(id: string) {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (expandedProduct === id) setExpandedProduct(null)
    loadData()
  }

  async function renameProduct(id: string) {
    if (!editProductName.trim()) { setEditingProduct(null); return }
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editProductName }),
    })
    setEditingProduct(null)
    loadData()
  }

  // ---- Keyword CRUD ----
  async function addKeyword(productId: string) {
    if (!newKeywordText.trim()) return
    await fetch(`/api/products/${productId}/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newKeywordText }),
    })
    setNewKeywordText('')
    setNewKeywordFor(null)
    loadData()
  }

  async function deleteKeyword(productId: string, keywordId: string) {
    await fetch(`/api/products/${productId}/keywords`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywordId }),
    })
    loadData()
  }

  // ---- Reply ----
  async function generateReply(post: ScanPost) {
    setGenerating(true)
    setMessage('')
    try {
      const product = getProductForPost(post)
      const res = await fetch('/api/replies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postContent: post.content,
          authorName: post.authorName,
          productInfo: product?.name || '',
          affiliateUrl: product?.affiliateUrl || '',
        }),
      })
      const data = await res.json()
      setReplyContent(data.content || '')
      setSelectedPost(post)
    } catch {
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
          accountId: selectedAccount.id,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage('✅ 發布成功！')
        setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, status: 'replied' } : p))
        setSelectedPost(null)
        setReplyContent('')
      } else {
        setMessage(`❌ ${data.error || data.message}`)
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`)
    } finally {
      setPublishing(false)
    }
  }

  // ---- Helpers ----
  function getProductForPost(post: ScanPost): Product | undefined {
    if (post.productId) return products.find(p => p.id === post.productId)
    return products.find(p => p.keywords.some(kw => kw.text === post.keyword))
  }

  function getPostsForProduct(productId: string): ScanPost[] {
    const product = products.find(p => p.id === productId)
    if (!product) return []
    return accountPosts.filter(post => {
      if (post.productId === productId) return true
      return product.keywords.some(kw => kw.text === post.keyword)
    })
  }

  function getKeywordStats(productId: string) {
    const productPosts = getPostsForProduct(productId)
    return {
      total: productPosts.length,
      new: productPosts.filter(p => p.status === 'new').length,
      replied: productPosts.filter(p => p.status === 'replied').length,
    }
  }

  // Total stats — all posts visible for this account
  const allNewPosts = accountPosts.filter(p => p.status === 'new')
  const allRepliedPosts = accountPosts.filter(p => p.status === 'replied')
  const totalNew = allNewPosts.length
  const totalReplied = allRepliedPosts.length

  // ---- No account ----
  if (!selectedAccount && accounts.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <LogIn className="w-10 h-10 mb-4 text-gray-600" />
        <p className="text-lg">請先在上方選擇一個帳號</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">🚔 巡邏中心</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {selectedAccount ? `@${selectedAccount.username} 的巡邏` : '管理商品 → 關鍵字 → 掃描 → 回覆'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      {/* Patrol Control Bar */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Trigger Button */}
            <button
              onClick={triggerPatrol}
              disabled={triggering}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
            >
              {triggering ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> 掃描中...</>
              ) : (
                <><Play className="w-4 h-4" /> 啟動巡邏</>
              )}
            </button>

            {/* Status */}
            <div className="flex items-center gap-3 text-sm">
              {scanStatus === 'running' && (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Radio className="w-4 h-4 animate-pulse" /> 掃描進行中...
                </span>
              )}
              {scanStatus === 'done' && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Zap className="w-4 h-4" /> 掃描已觸發
                </span>
              )}
            </div>

            {/* Last Scan Time */}
            {lastScanTime && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                上次掃描：{new Date(lastScanTime).toLocaleString('zh-TW')}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{totalNew}</div>
              <div className="text-gray-500">待回覆</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{totalReplied}</div>
              <div className="text-gray-500">已回覆</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-400">{accountProducts.length}</div>
              <div className="text-gray-500">商品</div>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Timer className="w-3.5 h-3.5" />
              <span>自動巡邏：每小時</span>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') || message.startsWith('🚀') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* ===== Left: Products & Posts (3 cols) ===== */}
        <div className="col-span-3 space-y-3">
          {accountProducts.length === 0 && (
            <div className="bg-gray-900/30 border border-gray-800/30 rounded-xl p-8 text-center">
              <Package className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">
                @{selectedAccount?.username} 尚未設定商品
              </p>
              <p className="text-gray-600 text-xs mt-1">點下方「新增商品」開始</p>
            </div>
          )}

          {accountProducts.map(product => {
            const isExpanded = expandedProduct === product.id
            const stats = getKeywordStats(product.id)
            const productPosts = isExpanded ? getPostsForProduct(product.id) : []
            const newPosts = productPosts.filter(p => p.status === 'new')
            const repliedPosts = productPosts.filter(p => p.status === 'replied')

            return (
              <div key={product.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                {/* Product Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <Package className="w-4 h-4 text-blue-400" />

                  {/* Product Name (editable) */}
                  {editingProduct === product.id ? (
                    <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                      <input value={editProductName} onChange={e => setEditProductName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && renameProduct(product.id)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200" autoFocus />
                      <button onClick={() => renameProduct(product.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-200 flex-1"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingProduct(product.id); setEditProductName(product.name) }}>
                      {product.name}
                    </span>
                  )}

                  {/* Keywords tags */}
                  <div className="flex items-center gap-1">
                    {product.keywords.slice(0, 3).map(kw => (
                      <span key={kw.id} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">{kw.text}</span>
                    ))}
                    {product.keywords.length > 3 && <span className="text-xs text-gray-500">+{product.keywords.length - 3}</span>}
                  </div>

                  {/* Post count */}
                  <div className="flex items-center gap-2 text-xs">
                    {stats.new > 0 && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{stats.new} 待回覆</span>}
                    {stats.replied > 0 && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{stats.replied} 已回覆</span>}
                    {stats.total === 0 && <span className="text-gray-600">無掃描結果</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => deleteProduct(product.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors" title="刪除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-800/50">
                    {/* Keywords */}
                    <div className="px-4 py-3 border-b border-gray-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">掃描關鍵字</span>
                        {newKeywordFor !== product.id ? (
                          <button onClick={() => { setNewKeywordFor(product.id); setNewKeywordText('') }}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                            <Plus className="w-3 h-3" /> 新增
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input value={newKeywordText} onChange={e => setNewKeywordText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addKeyword(product.id)}
                              placeholder="輸入關鍵字..." autoFocus
                              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 w-32" />
                            <button onClick={() => addKeyword(product.id)} className="text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setNewKeywordFor(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.keywords.length === 0 && (
                          <span className="text-xs text-gray-600">尚未設定關鍵字</span>
                        )}
                        {product.keywords.map(kw => (
                          <span key={kw.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 text-xs">
                            <Tag className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-300">{kw.text}</span>
                            <button onClick={() => deleteKeyword(product.id, kw.id)} className="text-gray-600 hover:text-red-400 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      {product.affiliateUrl && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                          <Link2 className="w-3 h-3" />
                          <span className="truncate max-w-60">{product.affiliateUrl}</span>
                        </div>
                      )}
                    </div>

                    {/* Posts */}
                    <div className="max-h-80 overflow-y-auto">
                      {newPosts.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Search className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            {product.keywords.length === 0 ? '請先新增關鍵字' : '此關鍵字尚無掃描結果，點「啟動巡邏」掃描'}
                          </p>
                        </div>
                      ) : (
                        newPosts.map(post => (
                          <div key={post.id}
                            onClick={() => { setSelectedPost(post); setReplyContent('') }}
                            className={`px-4 py-3 border-b border-gray-800/20 cursor-pointer transition-colors ${
                              selectedPost?.id === post.id ? 'bg-blue-500/10' : 'hover:bg-gray-800/20'
                            }`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">{post.platform === 'x' ? '𝕏' : '🧵'}</span>
                                <span className="text-xs font-medium text-gray-300">@{post.authorName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likeCount}</span>
                                <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{post.replyCount}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-700">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(post.scannedAt).toLocaleString('zh-TW')}
                              {post.url && (
                                <a href={post.url} target="_blank" onClick={e => e.stopPropagation()} className="ml-auto text-blue-500 hover:underline flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" />原文
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {repliedPosts.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-800/20">
                          <details className="text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-400">已回覆 ({repliedPosts.length})</summary>
                            {repliedPosts.map(post => (
                              <div key={post.id} className="py-2 border-b border-gray-800/10 last:border-0">
                                <span className="text-gray-500">@{post.authorName}</span>
                                <span className="text-emerald-600 ml-2">✓ 已回覆</span>
                              </div>
                            ))}
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Uncategorized scan results */}
          {(() => {
            // Posts that don't match any product's keywords
            const matchedKeywords = new Set(
              accountProducts.flatMap(p => p.keywords.map(kw => kw.text))
            )
            const uncategorized = accountPosts.filter(p => !matchedKeywords.has(p.keyword))
              .filter(p => p.status === 'new')
            if (uncategorized.length === 0) return null
            return (
              <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Search className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-gray-200 flex-1">未歸類掃描結果</span>
                  <span className="text-xs text-yellow-400">{uncategorized.length} 篇</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {uncategorized.map(post => (
                    <div key={post.id}
                      onClick={() => { setSelectedPost(post); setReplyContent('') }}
                      className={`px-4 py-3 border-t border-gray-800/20 cursor-pointer transition-colors ${
                        selectedPost?.id === post.id ? 'bg-blue-500/10' : 'hover:bg-gray-800/20'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{post.platform === 'x' ? '𝕏' : '🧵'}</span>
                          <span className="text-xs font-medium text-gray-300">@{post.authorName}</span>
                        </div>
                        <span className="text-xs text-yellow-500">keyword: {post.keyword}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-700">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(post.scannedAt).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Add Product */}
          {showNewProduct ? (
            <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-400 mb-3">
                新增商品 → @{selectedAccount?.username}
              </div>
              <div className="space-y-2">
                <input value={newProductName} onChange={e => setNewProductName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addProduct()}
                  placeholder="商品名稱（例如：韓國零食）" autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
                <input value={newProductUrl} onChange={e => setNewProductUrl(e.target.value)}
                  placeholder="分潤連結（例如：https://coupang.com/...）"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
                <div className="flex gap-2">
                  <button onClick={addProduct} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white">新增</button>
                  <button onClick={() => setShowNewProduct(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300">取消</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewProduct(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-700 hover:border-gray-600 rounded-xl text-sm text-gray-500 hover:text-gray-400 transition-colors">
              <Plus className="w-4 h-4" /> 新增商品（給 @{selectedAccount?.username}）
            </button>
          )}
        </div>

        {/* ===== Right: Reply Panel (2 cols) ===== */}
        <div className="col-span-2">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 sticky top-20">
            {selectedPost ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">原始貼文</h3>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-blue-400 mb-1">@{selectedPost.authorName}</div>
                    <p className="text-sm text-gray-200">{selectedPost.content}</p>
                  </div>
                  {selectedPost.url && (
                    <a href={selectedPost.url} target="_blank" className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" />查看原文
                    </a>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回覆 <span className="text-blue-400">@{selectedAccount?.username}</span>
                    </h3>
                    <button onClick={() => generateReply(selectedPost)} disabled={generating}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs text-white">
                      <Sparkles className={`w-3 h-3 ${generating ? 'animate-pulse' : ''}`} />
                      {generating ? '生成中...' : 'AI 生成'}
                    </button>
                  </div>
                  <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
                    placeholder="點「AI 生成」或手動輸入..."
                    className="w-full h-36 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500/50" />
                </div>

                <div className="flex gap-2">
                  <button onClick={publishReply} disabled={publishing || !replyContent}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium">
                    <Send className="w-4 h-4" />
                    {publishing ? '發布中...' : `以 @${selectedAccount?.username} 發布`}
                  </button>
                  <p className="text-xs text-gray-600 mt-1">⚠️ 回覆別人貼文需通過 Meta App Review（threads_manage_replies）</p>
                  <button onClick={() => {
                    setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, status: 'skipped' } : p))
                    setSelectedPost(null)
                    setReplyContent('')
                  }} className="flex items-center gap-1 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300">
                    <SkipForward className="w-4 h-4" /> 跳過
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MessageCircle className="w-8 h-8 mb-3 text-gray-700" />
                <p className="text-sm">展開商品 → 選擇一篇貼文</p>
                <p className="text-xs text-gray-600 mt-1">即可在此撰寫回覆</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
