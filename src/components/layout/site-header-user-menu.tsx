'use client'

import type { HeaderUser } from '@/components/layout/site-header-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'

export function SiteHeaderUserMenu({ user }: { user: HeaderUser }) {
  const isAdmin = user.role === 'ADMIN' || user.role === 'OWNER'

  async function logout() {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 ring-offset-background transition-all hover:ring-2 hover:ring-ring/40"
          aria-label="حساب کاربری"
        >
          <Avatar className="h-7 w-7 shadow-sm sm:h-8 sm:w-8">
            <AvatarImage src={user.image || ''} alt={user.name || 'user'} />
            <AvatarFallback className="text-xs font-bold">
              {(user.name || user.email || '?')[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl backdrop-blur-xl">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium">{user.name || user.username || 'کاربر'}</span>
          {user.email && (
            <span className="text-xs font-normal text-muted-foreground" dir="ltr">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer gap-2">
            <User className="h-4 w-4" />
            داشبورد
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer gap-2">
              <ShieldCheck className="h-4 w-4" />
              پنل مدیریت
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void logout()}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
