'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface Account {
  id: string
  platform: 'threads' | 'twitter' | 'instagram'
  platformUserId: string
  username: string
  name: string
  connected: boolean
}

interface AccountContextType {
  accounts: Account[]
  selectedAccount: Account | null
  selectAccount: (account: Account | null) => void
  loading: boolean
  refreshAccounts: () => Promise<void>
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  selectedAccount: null,
  selectAccount: () => {},
  loading: true,
  refreshAccounts: async () => {},
})

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/list')
      const data = await res.json()
      const list: Account[] = data.accounts || []
      setAccounts(list)

      // Auto-select: use localStorage preference, or first account
      const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedAccountId') : null
      if (saved && list.find(a => a.id === saved)) {
        setSelectedId(saved)
      } else if (list.length > 0) {
        setSelectedId(list[0].id)
      }
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const selectedAccount = accounts.find(a => a.id === selectedId) || null

  const selectAccount = useCallback((account: Account | null) => {
    setSelectedId(account?.id || null)
    if (account) {
      localStorage.setItem('selectedAccountId', account.id)
    }
  }, [])

  return (
    <AccountContext.Provider value={{
      accounts,
      selectedAccount,
      selectAccount,
      loading,
      refreshAccounts: loadAccounts,
    }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}
