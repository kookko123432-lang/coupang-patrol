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
  platforms: string[]
  scanEnabled: boolean
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

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 小時' },
  { value: 2, label: '2 小時' },
  { value: 3, label: '3 小時' },
  { value: 6, label: '6 小時' },
  { value: 12, label: '12 小時' },
  { value: 24, label: '24 小時' },
]

const PLATFORMS = [
  { id: 'threads', name: 'Threads', available: true },
  { id: 'twitter', name: 'X / Twitter', available: false },
  { id: 'instagram', name: 'Instagram', available: false },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    brandTone: 'casual', scanInterval: 60, autoPublish: false,
    aiProvider: 'zhipu', openaiKey: '', googleKey: '', zhipuKey: '',
    platforms: ['threads'], scanEnabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setSettings(p => ({
        ...p,
        brandTone: d.brandTone || p.brandTone,
        scanInterval: d.scanInterval || p.scanInterval,
        autoPublish: d.autoPublish ?? p.autoPublish,
        aiProvider: d.aiProvider || p.aiProvider,
        platforms: d.platforms || p.platforms,
        scanEnabled: d.scanEnabled ?? p.scanEnabled,
        // Don't overwrite keys with masked values
        ...(d.openaiKey && !d.openaiKey.includes('***') ? { openaiKey: d.openaiKey } : {}),
        ...(d.googleKey && !d.googleKey.includes('***') ? { googleKey: d.googleKey } : {}),
        ...(d.zhipuKey && !d.zhipuKey.includes('***') ? { zhipuKey: d.zhipuKey } : {}),
      }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }).catch(() => {})
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function update(key: keyof Settings, val: any) {
    setSettings(p => ({ ...p, [key]: val }))
  }

  function togglePlatform(platformId: string) {
    setSettings(p => ({
      ...p,
      platforms: p.platforms.includes(platformId)
        ? p.platforms.filter(id => id !== platformId)
        : [...p.platforms, platformId],
    }))
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
        {/* Scan Toggle */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-100 mb-1">掃描開關</h2>
              <p className="text-sm text-gray-500">啟用或停用自動掃描功能</p>
            </div>
            <button onClick={() => update('scanEnabled', !settings.scanEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.scanEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${settings.scanEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          {!settings.scanEnabled && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              ⚠️ 掃描已停用，將不會自動搜尋 Threads 貼文。你仍可手動觸發掃描。
            </div>
          )}
        </div>

        {/* Scan Platforms */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-1">掃描平台</h2>
          <p className="text-sm text-gray-500 mb-4">選擇要監控的社群平台</p>
          <div className="space-y-3">
            {PLATFORMS.map(platform => (
              <label key={platform.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  settings.platforms.includes(platform.id)
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-gray-700 bg-gray-800/30'
                } ${!platform.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={settings.platforms.includes(platform.id)}
                  onChange={() => platform.available && togglePlatform(platform.id)}
                  disabled={!platform.available}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{platform.name}</div>
                </div>
                {!platform.available && (
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-gray-800">即將推出</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Scan Interval */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-1">掃描頻率</h2>
          <p className="text-sm text-gray-500 mb-4">自動掃描的間隔時間</p>
          <div className="grid grid-cols-3 gap-2">
            {INTERVAL_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => update('scanInterval', opt.value)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  settings.scanInterval === opt.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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
