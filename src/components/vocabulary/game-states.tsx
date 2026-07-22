'use client'

/**
 * Shared pre-game states: the loading spinner and the
 * "not enough words" empty state. Used by the match / listen / spell
 * games (all three render identical markup for these two phases).
 */

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function GameLoading({
  message = 'بارگذاری واژگان...',
}: {
  message?: string
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {message}
      </div>
    </div>
  )
}

export interface GameEmptyProps {
  icon: ReactNode
  message: string
  backHref?: string
  backLabel?: string
}

export function GameEmpty({
  icon,
  message,
  backHref = '/vocabulary',
  backLabel = 'رفتن به واژگان',
}: GameEmptyProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
          {icon}
        </span>
        <h1 className="text-2xl font-bold">واژه کافی نیست</h1>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="glow">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
