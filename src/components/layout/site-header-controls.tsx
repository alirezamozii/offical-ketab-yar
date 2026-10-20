'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import { Moon, Search, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { SiteHeaderAuth } from '@/components/layout/site-header-auth'

const HeaderSearchModal = lazy(() => import('@/components/layout/header-search-modal').then((module) => ({ default: module.HeaderSearchModal })))

export function SiteHeaderControls() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !searchOpen && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === 'Escape') setSearchOpen(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [searchOpen])

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault()
    const value = query.trim()
    if (value) window.location.assign(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button type="button" onClick={() => setSearchOpen(true)} aria-label="جستجو (/)" title="جستجو (/)" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:h-9 sm:w-9"><Search aria-hidden="true" className="h-4.5 w-4.5 sm:h-5 sm:w-5" /></button>
      <button id="theme-toggle" type="button" aria-label="تغییر تم روشن/تاریک" title="تغییر تم روشن/تاریک" className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:h-9 sm:w-9"><Sun aria-hidden="true" className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 sm:h-5 sm:w-5" /><Moon aria-hidden="true" className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 sm:h-5 sm:w-5" /></button>
      <SiteHeaderAuth />
      {searchOpen && <Suspense fallback={null}><HeaderSearchModal open query={query} setQuery={setQuery} onClose={() => setSearchOpen(false)} onSubmit={submit} /></Suspense>}
    </div>
  )
}
