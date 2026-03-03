'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Upload, LogOut, Video, UserCog, Menu, X } from 'lucide-react'
import type { Profile } from '@/types'

interface DashboardSidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: '動画一覧', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: '動画アップロード', icon: Upload },
  { href: '/dashboard/profile', label: 'プロフィール編集', icon: UserCog },
]

export default function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">mirumed</p>
            <p className="text-xs text-gray-500">医療動画プラットフォーム</p>
          </div>
        </div>
        {/* モバイルの閉じるボタン */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-400 hover:text-gray-600 min-h-0 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                    isActive
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Profile + Logout */}
      <div className="p-4 border-t border-gray-100">
        {profile && (
          <div className="mb-3 px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile.clinic_name}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full min-h-[44px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          ログアウト
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* モバイルトップバー */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-600 hover:text-gray-900 min-h-0 p-1"
          aria-label="メニューを開く"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">mirumed</span>
        </div>
      </header>

      {/* デスクトップ固定サイドバー */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex-col">
        {sidebarContent}
      </aside>

      {/* モバイルオーバーレイ */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* モバイルドロワー */}
      <aside
        className={cn(
          'md:hidden fixed left-0 top-0 h-full w-72 bg-white z-50 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
