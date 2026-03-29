'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react'

interface Keyword {
  id: string
  keyword: string
  active: boolean
  scanCount: number
  createdAt: string
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValue, setFormValue] = useState('')
  const [filter, setFilter] = useState('')

  async function fetchKeywords() {
    try {
      const res = await fetch('/api/keywords')
      const data = await res.json()
      setKeywords(data)
    } catch {
      setKeywords([
        { id: '1', keyword: '酷澎推薦', active: true, scanCount: 45, createdAt: new Date().toISOString() },
        { id: '2', keyword: '尿布推薦', active: true, scanCount: 32, createdAt: new Date().toISOString() },
        { id: '3', keyword: '韓國零食', active: true, scanCount: 28, createdAt: new Date().toISOString() },
        { id: '4', keyword: '酷澎', active: true, scanCount: 67, createdAt: new Date().toISOString() },
        { id: '5', keyword: '韓國美妝', active: false, scanCount: 12, createdAt: new Date().toISOString() },
        { id: '6', keyword: '省錢', active: true, scanCount: 19, createdAt: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeywords()
  }, [])

  async function handleSubmit() {
    if (!formValue.trim()) return

    if (editingId) {
      try {
        await fetch('/api/keywords', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, keyword: formValue.trim() }),
        })
      } catch {
        setKeywords((prev) =>
          prev.map((kw) => (kw.id === editingId ? { ...kw, keyword: formValue.trim() } : kw))
        )
      }
    } else {
      try {
        await fetch('/api/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: formValue.trim() }),
        })
      } catch {
        setKeywords((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            keyword: formValue.trim(),
            active: true,
            scanCount: 0,
            createdAt: new Date().toISOString(),
          },
        ])
      }
    }

    setShowModal(false)
    setEditingId(null)
    setFormValue('')
    fetchKeywords()
  }

  async function handleToggle(id: string) {
    const kw = keywords.find((k) => k.id === id)
    if (!kw) return

    try {
      await fetch('/api/keywords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !kw.active }),
      })
    } catch {
      // fallback handled below
    }
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    )
  }

  async function handleDelete(id: string) {
    try {
      await fetch('/api/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // fallback handled below
    }
    setKeywords((prev) => prev.filter((k) => k.id !== id))
  }

  function openEdit(kw: Keyword) {
    setEditingId(kw.id)
    setFormValue(kw.keyword)
    setShowModal(true)
  }

  function openCreate() {
    setEditingId(null)
    setFormValue('')
    setShowModal(true)
  }

  const filtered = keywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">關鍵字管理</h1>
          <p className="text-gray-400 mt-1">管理你想要監控的 Threads 關鍵字</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增關鍵字
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="搜尋關鍵字..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">關鍵字</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">掃描次數</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><div className="h-4 w-32 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-16 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-12 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-800 rounded animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-500 text-sm">
                  {filter ? '找不到符合的關鍵字' : '尚未新增任何關鍵字'}
                </td>
              </tr>
            ) : (
              filtered.map((kw) => (
                <tr key={kw.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-gray-200">{kw.keyword}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(kw.id)}
                      className="flex items-center gap-2 group"
                    >
                      {kw.active ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs text-emerald-400">啟用中</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-500" />
                          <span className="text-xs text-gray-500">已停用</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-400">{kw.scanCount}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(kw)}
                        className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(kw.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              {editingId ? '編輯關鍵字' : '新增關鍵字'}
            </h2>
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="輸入關鍵字，例如：酷澎推薦"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                }}
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
