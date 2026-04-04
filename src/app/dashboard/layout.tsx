'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import { AccountProvider } from '@/lib/account-context'
import AccountSelector from '@/components/AccountSelector'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <div className="min-h-screen bg-gray-950">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <AccountSelector />
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AccountProvider>
  )
}
