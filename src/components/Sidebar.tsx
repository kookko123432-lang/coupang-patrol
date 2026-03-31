'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Key,
  Package,
  ScanSearch,
  BarChart3,
  Settings,
  Shield,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '儀表板', icon: LayoutDashboard },
  { href: '/dashboard/accounts', label: '帳號管理', icon: Link2 },
  { href: '/dashboard/products', label: '商品管理', icon: Package },
  { href: '/dashboard/scan', label: '掃描結果', icon: ScanSearch },
  { href: '/dashboard/analytics', label: '數據分析', icon: BarChart3 },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-950 border-r border-gray-800/50 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-800/50">
        <Shield className="w-6 h-6 text-blue-500" />
        <span className="text-lg font-bold text-gray-100">Coupang Patrol</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold">
            D
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">Demo 用戶</div>
            <div className="text-xs text-gray-500">demo@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
