'use client'

import { LogIn } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

export interface HeaderUser {
  name?: string | null
  email?: string | null
  image?: string | null
  username?: string | null
  role?: string | null
}

const SiteHeaderUserMenu = lazy(() =>
  import('@/components/layout/site-header-user-menu').then((module) => ({
    default: module.SiteHeaderUserMenu,
  })),
)

async function readSession(): Promise<HeaderUser | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
    if (!response.ok) return null
    const session = (await response.json()) as { user?: HeaderUser }
    return session.user ?? null
  } catch {
    return null
  }
}

export function SiteHeaderAuth() {
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [checked, setChecked] = useState(false)

  const refresh = useCallback(async () => {
    if (checked) return user
    const nextUser = await readSession()
    setUser(nextUser)
    setChecked(true)
    return nextUser
  }, [checked, user])

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh()
    }, 8000)
    return () => clearTimeout(timer)
  }, [refresh])

  async function handleLogin() {
    const activeUser = await refresh()
    if (activeUser) return
    const { signIn } = await import('next-auth/react')
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (user) {
    return (
      <Suspense fallback={<span className="h-8 w-8 rounded-full bg-muted" />}>
        <SiteHeaderUserMenu user={user} />
      </Suspense>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogin()}
      className="group relative inline-flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3 text-xs font-bold sm:h-9 sm:gap-2 sm:px-4 sm:text-sm md:h-10"
      aria-label="ورود با گوگل"
      style={{
        background: 'linear-gradient(135deg, #b8956a 0%, #8a6847 50%, #6d523a 100%)',
        color: '#fff',
        boxShadow: '0 4px 14px rgba(138, 104, 71, 0.35)',
      }}
    >
      <LogIn aria-hidden="true" className="relative z-10 h-3.5 w-3.5" strokeWidth={2.5} />
      <span className="relative z-10">ورود</span>
    </button>
  )
}
