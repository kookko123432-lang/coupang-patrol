'use client'

import { useState, useEffect } from 'react'
import { Save, Check } from 'lucide-react'
import { AVAILABLE_PROVIDERS, type AIProvider } from '@/lib/ai-generator'

interface Settings {
  brandTone: string
  scanInterval: number
  autoPublish: boolean
  aiProvider: AIProvider
  openaiKey: string
  googleKey: string
  zhipuKey: string
}

const KEY_FIELDS: Record<AIProvider, keyof Settings> = {
  openai: 'openaiKey',
  google: 'googleKey',
  zhipu: 'zhipuKey',
}

const KEY_INFO: Record<AIProvider, { label: string; placeholder: string; hint: string }> = {
  openai: { label: 'OpenAI API Key', placeholder: 'sk-...', hint: '從 platform.openai.com 取得' },
  google: { label: 'Google AI API Key', placeholder: 'AIza...', hint: '從 aistudio.google.com 取得' },
  zhipu: { label: '智譜 AI API Key', placeholder: '你的智譜 Key', hint: '從 open.bigmodel.cn 取得' },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    brandTone: 'casual', scanInterval: 15, autoPublish: false,
    aiProvider: 'openai', openaiKey: '', googleKey: '', zhipuKey: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setSettings(p => ({ ...p, ...d }))).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }).catch(() => {})
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function update(key: keyof Settings, val: any) {
    setSettings(p => ({ ...p, [key]: val }))
  }

  if (loading) {
    return <div className="p-8"><div className="animate-pulse space-y-6"><div className="h-8 w-32 bg-gray-800 rounded" /><div className="h-64 bg-gray-800 rounded-xl" /></div></div>
  }

  const currentKeyField = KEY_FIELDS[settings.aiProvider]
  const currentKeyInfo = KEY_INFO[settings.aiProvider]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">設定</h1>
        <p className="text-gray-400 mt-1">調整你的海巡系統偏好設定</p>
      </div>

      <div className="space-y-6">
        {/* Brand Tone */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-1">品牌語氣</h2>
          <p className="text-sm text-gray-500 mb-4">設定 AI 生成回覆時的語氣風格</p>
          <select value={settings.brandTone} onChange={e => update('brandTone', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100">
            <option value="casual">輕鬆友善 — 像朋友聊天</option>
            <option value="professional">專業親和 — 專業但有親和力</option>
            <option value="funny">幽默風趣 — 偶爾用 emoji</option>
            <option value="expert">專家口吻 — 提供深入見解</option>
          </select>
        </div>

        {/* Scan Interval */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-1">掃描間隔</h2>
          <p className="text-sm text-gray-500 mb-4">自動掃描的頻率</p>
          <div className="flex items-center gap-4">
            <input type="range" min="5" max="60" step="5" value={settings.scanInterval}
              onChange={e => update('scanInterval', parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <span className="text-sm font-medium text-gray-200 min-w-[5ch] text-center">{settings.scanInterval} 分</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2"><span>5 分鐘</span><span>60 分鐘</span></div>
        </div>

        {/* AI Provider */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-1">AI 引擎</h2>
          <p className="text-sm text-gray-500 mb-4">選擇文案生成的 AI 服務商</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {AVAILABLE_PROVIDERS.map(p => (
              <button key={p.id} onClick={() => update('aiProvider', p.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  settings.aiProvider === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}>
                <div className="text-sm font-medium text-gray-200">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">{p.description}</div>
              </button>
            ))}
          </div>
          <input type="password" value={settings[currentKeyField] as string}
            onChange={e => update(currentKeyField, e.target.value)}
            placeholder={currentKeyInfo.placeholder}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100" />
          <p className="text-xs text-gray-600 mt-2">{currentKeyInfo.hint}。未設定將使用模板生成。</p>
        </div>

        {/* Auto Publish */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">自動發布</h2>
              <p className="text-sm text-gray-500">AI 審核通過後直接發布，不需手動確認</p>
            </div>
            <button onClick={() => update('autoPublish', !settings.autoPublish)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoPublish ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${settings.autoPublish ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {settings.autoPublish && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              ⚠️ 開啟自動發布後，AI 生成的回覆將立即發布到 Threads，請確保品牌語氣設定正確。
            </div>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          {saving ? '儲存中...' : saved ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存設定</>}
        </button>
      </div>
    </div>
  )
}
