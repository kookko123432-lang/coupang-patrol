'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronRight, ExternalLink, Sparkles,
  Send, SkipForward, Heart, MessageCircle, Clock, RefreshCw,
  Package, Search, Link2, Settings2, LogIn, Edit3, X, Check, Tag
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
  createdAt: string
}

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
  productId?: string
  reply?: { content: string; status: string }
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
    setPosts(Array.isArray(postRes) ? postRes : [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ---- Product CRUD ----
  async function addProduct() {
    if (!newProductName.trim()) return
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProductName, affiliateUrl: newProductUrl, description: '' }),
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
      const res = await fetch('/api/replies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent: post.content, authorName: post.authorName, productInfo: getProductForPost(post)?.name || '' }),
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
    if (!selectedPost || !replyContent) return
    setPublishing(true)
    try {
      const res = await fetch('/api/replies/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          threadsPostId: selectedPost.threadsPostId,
          authorName: selectedPost.authorName,
          accountId: selectedAccount?.id,
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
    // Match by keyword
    return products.find(p => p.keywords.some(kw => kw.text === post.keyword))
  }

  function getPostsForProduct(productId: string): ScanPost[] {
    const product = products.find(p => p.id === productId)
    if (!product) return []
    return posts.filter(post => {
      if (post.productId === productId) return true
      return product.keywords.some(kw => kw.text === post.keyword)
    })
  }

  function getKeywordStats(productId: string) {
    const product = products.find(p => p.id === productId)
    if (!product) return { total: 0, new: 0, replied: 0 }
    const productPosts = getPostsForProduct(productId)
    return {
      total: productPosts.length,
      new: productPosts.filter(p => p.status === 'new').length,
      replied: productPosts.filter(p => p.status === 'replied').length,
    }
  }

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
            管理「商品 → 關鍵字 → 掃描 → 回覆」整個流程
          </p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors">
          <RefreshCw className="w-4 h-4" /> 重新載入
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* ===== Left: Products & Posts (3 cols) ===== */}
        <div className="col-span-3 space-y-3">
          {/* Product List */}
          {products.map(product => {
            const isExpanded = expandedProduct === product.id
            const stats = getKeywordStats(product.id)
            const productPosts = isExpanded ? getPostsForProduct(product.id) : []

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
                      <input
                        value={editProductName}
                        onChange={e => setEditProductName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && renameProduct(product.id)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                        autoFocus
                      />
                      <button onClick={() => renameProduct(product.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span
                      className="font-medium text-gray-200 flex-1"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingProduct(product.id); setEditProductName(product.name) }}
                    >
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
                    <button onClick={() => deleteProduct(product.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors" title="刪除商品">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded: Keywords + Posts */}
                {isExpanded && (
                  <div className="border-t border-gray-800/50">
                    {/* Keywords Section */}
                    <div className="px-4 py-3 border-b border-gray-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">掃描關鍵字</span>
                        {newKeywordFor !== product.id ? (
                          <button
                            onClick={() => { setNewKeywordFor(product.id); setNewKeywordText('') }}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Plus className="w-3 h-3" /> 新增關鍵字
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              value={newKeywordText}
                              onChange={e => setNewKeywordText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addKeyword(product.id)}
                              placeholder="輸入關鍵字..."
                              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 w-32"
                              autoFocus
                            />
                            <button onClick={() => addKeyword(product.id)} className="text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setNewKeywordFor(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.keywords.length === 0 && (
                          <span className="text-xs text-gray-600">尚未設定關鍵字，點「新增關鍵字」開始</span>
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

                    {/* Posts Section */}
                    <div className="max-h-80 overflow-y-auto">
                      {productPosts.filter(p => p.status === 'new').length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Search className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            {product.keywords.length === 0 ? '請先新增關鍵字' : '此關鍵字尚無掃描結果'}
                          </p>
                        </div>
                      ) : (
                        productPosts.filter(p => p.status === 'new').map(post => (
                          <div
                            key={post.id}
                            onClick={() => { setSelectedPost(post); setReplyContent('') }}
                            className={`px-4 py-3 border-b border-gray-800/20 cursor-pointer transition-colors ${
                              selectedPost?.id === post.id ? 'bg-blue-500/10' : 'hover:bg-gray-800/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-300">@{post.authorName}</span>
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
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Product Button */}
          {showNewProduct ? (
            <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-400 mb-3">新增商品</div>
              <div className="space-y-2">
                <input
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addProduct()}
                  placeholder="商品名稱（例如：韓國零食）"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                  autoFocus
                />
                <input
                  value={newProductUrl}
                  onChange={e => setNewProductUrl(e.target.value)}
                  placeholder="分潤連結（例如：https://coupang.com/...）"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2">
                  <button onClick={addProduct} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white">新增</button>
                  <button onClick={() => setShowNewProduct(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300">取消</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewProduct(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-700 hover:border-gray-600 rounded-xl text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> 新增商品
            </button>
          )}
        </div>

        {/* ===== Right: Reply Panel (2 cols) ===== */}
        <div className="col-span-2">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 sticky top-20">
            {selectedPost ? (
              <div className="space-y-4">
                {/* Original Post */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">原始貼文</h3>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-blue-400 mb-1">@{selectedPost.authorName}</div>
                    <p className="text-sm text-gray-200">{selectedPost.content}</p>
                  </div>
                  {selectedPost.url && (
                    <a href={selectedPost.url} target="_blank" className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-400 hover:underline">
                      <ExternalLink className="w-3 h-3" />在 Threads 查看
                    </a>
                  )}
                </div>

                {/* Reply Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回覆內容
                      <span className="text-blue-400 ml-1">（以 @{selectedAccount?.username} 發布）</span>
                    </h3>
                    <button onClick={() => generateReply(selectedPost)} disabled={generating}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs text-white">
                      <Sparkles className={`w-3 h-3 ${generating ? 'animate-pulse' : ''}`} />
                      {generating ? '生成中...' : 'AI 生成'}
                    </button>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="點「AI 生成」或手動輸入回覆..."
                    className="w-full h-36 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={publishReply}
                    disabled={publishing || !replyContent}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {publishing ? '發布中...' : '發布回覆'}
                  </button>
                  <button
                    onClick={() => {
                      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, status: 'skipped' } : p))
                      setSelectedPost(null)
                      setReplyContent('')
                    }}
                    className="flex items-center gap-1 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300"
                  >
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
