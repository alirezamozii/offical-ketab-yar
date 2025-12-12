'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  BookOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navigation = [
  { name: 'داشبورد', href: '/admin', icon: Home },
  { name: 'مدیریت کتاب‌ها', href: '/admin/books', icon: BookOpen },
  { name: 'کاربران', href: '/admin/users', icon: Users },
  { name: 'آمار و تحلیل', href: '/admin/analytics', icon: BarChart3 },
  { name: 'تنظیمات', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-64 bg-card border-l transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gold" />
              <span className="text-xl font-bold">کتاب‌یار</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4" dir="rtl">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4" dir="rtl">
            <Link href="/auth/logout">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <LogOut className="h-5 w-5" />
                خروج
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
