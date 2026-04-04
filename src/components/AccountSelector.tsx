'use client'

import { useAccount } from '@/lib/account-context'
import { ChevronDown, User, Globe, RefreshCw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const platformIcons: Record<string, string> = {
  threads: '🧵',
  twitter: '𝕏',
  instagram: '📸',
}

const platformLabels: Record<string, string> = {
  threads: 'Threads',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
}

export default function AccountSelector() {
  const { accounts, selectedAccount, selectAccount, loading, refreshAccounts } = useAccount()
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await refreshAccounts()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="h-14 border-b border-gray-800/50 bg-gray-900/50 flex items-center px-6">
        <div className="animate-pulse text-sm text-gray-500">載入帳號中...</div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="h-14 border-b border-gray-800/50 bg-gray-900/50 flex items-center px-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="w-4 h-4" />
          <span>尚未連結帳號</span>
          <a href="/dashboard/accounts" className="text-blue-400 hover:underline ml-1">前往連結 →</a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-14 border-b border-gray-800/50 bg-gray-900/50 flex items-center justify-between px-6">
      {/* Account Selector */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
        >
          {selectedAccount ? (
            <>
              <span className="text-lg">{platformIcons[selectedAccount.platform] || '🔗'}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-200">
                  @{selectedAccount.username}
                </div>
                <div className="text-xs text-gray-500">
                  {platformLabels[selectedAccount.platform] || selectedAccount.platform}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">選擇帳號</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              切換帳號
            </div>
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => { selectAccount(account); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 transition-colors ${
                  selectedAccount?.id === account.id ? 'bg-blue-600/10' : ''
                }`}
              >
                <span className="text-lg">{platformIcons[account.platform] || '🔗'}</span>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-200">@{account.username}</div>
                  <div className="text-xs text-gray-500">{platformLabels[account.platform] || account.platform}</div>
                </div>
                {selectedAccount?.id === account.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
                <div className={`w-2 h-2 rounded-full ${account.connected ? 'bg-emerald-500' : 'bg-red-500'}`} title={account.connected ? '已連線' : '未連線'} />
              </button>
            ))}
            <div className="border-t border-gray-800 mt-1 pt-1">
              <a
                href="/dashboard/accounts"
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-gray-800/50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                管理帳號
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Right side: status indicator */}
      <div className="flex items-center gap-3">
        <button onClick={handleRefresh} className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors" title="重新整理">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        {selectedAccount && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${selectedAccount.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={selectedAccount.connected ? 'text-emerald-400' : 'text-red-400'}>
              {selectedAccount.connected ? '已連線' : '未連線'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
