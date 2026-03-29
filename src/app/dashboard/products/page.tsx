'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  affiliateUrl: string
  category: string | null
  active: boolean
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', affiliateUrl: '', category: '' })

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch {
      setProducts([
        { id: '1', name: '好奇鉑金系列尿布', description: '超柔軟透氣，適合敏感肌寶寶', affiliateUrl: 'https://www.coupang.com/p1', category: '母嬰', active: true, createdAt: new Date().toISOString() },
        { id: '2', name: '韓國農心辛拉面', description: '經典韓國泡麵，香辣夠味', affiliateUrl: 'https://www.coupang.com/p2', category: '零食', active: true, createdAt: new Date().toISOString() },
        { id: '3', name: '雪花秀潤燥精華', description: '韓國頂級保養品，保濕修護', affiliateUrl: 'https://www.coupang.com/p3', category: '美妝', active: true, createdAt: new Date().toISOString() },
        { id: '4', name: 'LG高效洗衣精', description: '天然成分，溫和不刺激', affiliateUrl: 'https://www.coupang.com/p4', category: '居家', active: true, createdAt: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ name: '', description: '', affiliateUrl: '', category: '' })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description || '',
      affiliateUrl: p.affiliateUrl,
      category: p.category || '',
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.affiliateUrl.trim()) return

    if (editingId) {
      try {
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        })
      } catch {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
        )
      }
    } else {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } catch {
        setProducts((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            ...form,
            active: true,
            createdAt: new Date().toISOString(),
          },
        ])
      }
    }

    setShowModal(false)
    fetchProducts()
  }

  async function handleDelete(id: string) {
    try {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // fallback handled below
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const categoryColors: Record<string, string> = {
    '母嬰': 'bg-pink-500/10 text-pink-400',
    '零食': 'bg-amber-500/10 text-amber-400',
    '美妝': 'bg-purple-500/10 text-purple-400',
    '居家': 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">商品管理</h1>
          <p className="text-gray-400 mt-1">管理你的推廣商品與分潤連結</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增商品
        </button>
      </div>

      {/* Product Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-5 w-40 bg-gray-800 rounded mb-3" />
              <div className="h-4 w-full bg-gray-800 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">尚未新增任何商品</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            新增第一個商品
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-100">{product.name}</h3>
                  {product.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[product.category] || 'bg-gray-700 text-gray-300'}`}>
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(product)}
                    className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-gray-400 mb-4">{product.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{product.affiliateUrl}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              {editingId ? '編輯商品' : '新增商品'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">商品名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：好奇鉑金系列尿布"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">商品描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="簡短描述商品特色"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">分潤連結 *</label>
                <input
                  type="url"
                  value={form.affiliateUrl}
                  onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
                  placeholder="https://www.coupang.com/..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">分類</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                >
                  <option value="">選擇分類</option>
                  <option value="母嬰">母嬰</option>
                  <option value="零食">零食</option>
                  <option value="美妝">美妝</option>
                  <option value="居家">居家</option>
                  <option value="食品">食品</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {editingId ? '儲存' : '新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
