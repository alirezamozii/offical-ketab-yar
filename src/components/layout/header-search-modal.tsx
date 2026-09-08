'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderSearchModalProps {
  open: boolean
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  onSubmit: (e?: React.FormEvent) => void
}

export function HeaderSearchModal({
  open,
  onClose,
  query,
  setQuery,
  onSubmit,
}: HeaderSearchModalProps) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="جستجو"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'duration-200 ease-out motion-reduce:transition-none',
      )}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'mt-20 w-full max-w-2xl px-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4',
          'duration-200 ease-out motion-reduce:transition-none',
        )}
      >
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl"
        >
          <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی کتاب، نویسنده یا ژانر…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="جستجو"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="پاک کردن"
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button type="submit" size="sm" variant="glow" disabled={!query.trim()}>
            جستجو
          </Button>
        </form>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Enter بزنید تا به صفحه نتایج کامل برید · Escape برای بستن
        </p>
      </div>
    </div>
  )
}
