'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, Sparkles, ToggleLeft, ToggleRight, Clock, MessageSquare, Package, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react'

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

const SCAN_INTERVALS = [
  { value: 60, label: '每 1 小時' },
  { value: 120, label: '每 2 小時' },
  { value: 360, label: '每 6 小時' },
  { value: 720, label: '每 12 小時' },
  { value: 1440, label: '每 24 小時' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', affiliateUrl: '', category: '' })
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({})
  const [suggesting, setSuggesting] = useState<string | null>(null)
  const [suggestedKws, setSuggestedKws] = useState<Record<string, string[]>>({})
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      setProducts(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.affiliateUrl) return flash('❌ 名稱和連結為必填')
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    })
    if (res.ok) {
      const p = await res.json()
      setProducts([...products, p])
      setNewProduct({ name: '', description: '', affiliateUrl: '', category: '' })
      setShowAdd(false)
      setExpandedId(p.id)
      flash('✅ 商品已新增')
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('確定要刪除此商品？')) return
    await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setProducts(products.filter(p => p.id !== id))
    flash('🗑️ 商品已刪除')
  }

  async function addKeyword(productId: string) {
    const text = newKeyword[productId]?.trim()
    if (!text) return
    const res = await fetch('/api/products/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, text }),
    })
    if (res.ok) {
      await load()
      setNewKeyword({ ...newKeyword, [productId]: '' })
    } else {
      const d = await res.json()
      flash(d.error === '關鍵字已存在' ? '⚠️ 關鍵字已存在' : '❌ 新增失敗')
    }
  }

  async function toggleKeyword(productId: string, keywordId: string, field: 'scanEnabled' | 'autoReply') {
    const product = products.find(p => p.id === productId)
    const kw = product?.keywords.find(k => k.id === keywordId)
    if (!kw) return
    await fetch('/api/products/keywords', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, keywordId, [field]: !kw[field] }),
    })
    await load()
  }

  async function changeInterval(productId: string, keywordId: string, interval: number) {
    await fetch('/api/products/keywords', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, keywordId, scanInterval: interval }),
    })
    await load()
  }

  async function deleteKeyword(productId: string, keywordId: string) {
    await fetch('/api/products/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, keywordId }),
    })
    await load()
  }

  async function suggestKeywords(productId: string) {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setSuggesting(productId)
    try {
      const res = await fetch('/api/keywords/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: product.name, description: product.description, category: product.category }),
      })
      const data = await res.json()
      setSuggestedKws({ ...suggestedKws, [productId]: data.keywords || [] })
    } catch {}
    setSuggesting(null)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          {[1, 2].map(i => <div key={i} className="h-40 bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">商品管理</h1>
          <p className="text-gray-400 mt-1 text-sm">管理商品、關鍵字與掃描設定</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />新增商品
        </button>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-lg text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">{msg}</div>
      )}

      {/* Add Product Form */}
      {showAdd && (
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-100">新增商品</h3>
            <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-300" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">商品名稱 *</label>
              <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500" placeholder="例：好奇尿布 L號" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">分類</label>
              <input value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500" placeholder="例：嬰兒用品" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-400 block mb-1">分潤連結 *</label>
              <input value={newProduct.affiliateUrl} onChange={e => setNewProduct({ ...newProduct, affiliateUrl: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-400 block mb-1">商品描述</label>
              <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="簡短描述商品特色..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">取消</button>
            <button onClick={addProduct} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white font-medium">新增</button>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">還沒有商品</p>
          <p className="text-gray-600 text-sm mt-1">新增你的第一個分潤商品，並設定掃描關鍵字</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => {
            const expanded = expandedId === product.id
            return (
              <div key={product.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                {/* Product Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : product.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-100">{product.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        {product.category && <span>{product.category}</span>}
                        <span>{product.keywords.length} 個關鍵字</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={product.affiliateUrl} target="_blank" className="text-gray-500 hover:text-blue-400" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={e => { e.stopPropagation(); deleteProduct(product.id) }} className="text-gray-600 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded: Keywords */}
                {expanded && (
                  <div className="border-t border-gray-800/50 p-4 space-y-4">
                    <p className="text-sm text-gray-400">{product.description}</p>

                    {/* Add Keyword */}
                    <div className="flex gap-2">
                      <input
                        value={newKeyword[product.id] || ''}
                        onChange={e => setNewKeyword({ ...newKeyword, [product.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && addKeyword(product.id)}
                        placeholder="輸入關鍵字後按 Enter..."
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button onClick={() => addKeyword(product.id)} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => suggestKeywords(product.id)}
                        disabled={suggesting === product.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {suggesting === product.id ? '生成中...' : 'AI 推薦'}
                      </button>
                    </div>

                    {/* AI Suggestions */}
                    {suggestedKws[product.id]?.length > 0 && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                        <div className="text-xs text-purple-400 mb-2">AI 推薦關鍵字（點擊加入）：</div>
                        <div className="flex flex-wrap gap-2">
                          {suggestedKws[product.id].map(kw => (
                            <button
                              key={kw}
                              onClick={async () => {
                                await fetch('/api/products/keywords', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ productId: product.id, text: kw }),
                                })
                                await load()
                              }}
                              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-md text-xs transition-colors"
                            >
                              + {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords List */}
                    {product.keywords.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">還沒有關鍵字，新增或用 AI 推薦</p>
                    ) : (
                      <div className="space-y-2">
                        {product.keywords.map(kw => (
                          <div key={kw.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Search className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-200 font-medium">{kw.text}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Scan Toggle */}
                              <button
                                onClick={() => toggleKeyword(product.id, kw.id, 'scanEnabled')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${kw.scanEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-gray-800'}`}
                                title="定時掃描"
                              >
                                {kw.scanEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                <Clock className="w-3 h-3" />
                                <select
                                  value={kw.scanInterval}
                                  onChange={e => changeInterval(product.id, kw.id, parseInt(e.target.value))}
                                  onClick={e => e.stopPropagation()}
                                  className="bg-transparent text-xs outline-none cursor-pointer"
                                >
                                  {SCAN_INTERVALS.map(si => <option key={si.value} value={si.value} className="bg-gray-900">{si.label}</option>)}
                                </select>
                              </button>

                              {/* Auto Reply Toggle */}
                              <button
                                onClick={() => toggleKeyword(product.id, kw.id, 'autoReply')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${kw.autoReply ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 bg-gray-800'}`}
                                title="自動回覆"
                              >
                                {kw.autoReply ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                <MessageSquare className="w-3 h-3" />
                                自動回覆
                              </button>

                              {/* Delete */}
                              <button onClick={() => deleteKeyword(product.id, kw.id)} className="text-gray-600 hover:text-red-400">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
