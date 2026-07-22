'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, Link2, Share2, Send, Twitter } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareButtonProps {
  bookSlug: string
  bookTitle: string
}

export function ShareButton({ bookSlug, bookTitle }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/books/${bookSlug}`
      : `/books/${bookSlug}`
  const text = `در حال خواندن «${bookTitle}» در کتاب‌یار — مطالعه دوزبانه با هوش مصنوعی`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('لینک کپی شد')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('کپی ناموفق بود')
    }
  }

  /**
   * Native share sheet on mobile / Safari / Chrome Android. Falls back to
   * opening the popover on desktop browsers that don't implement the Web
   * Share API.
   *
   * NOTE: we use `typeof navigator.share === 'function'` rather than the
   * truthy `if (navigator.share)` check — the TypeScript DOM lib types
   * `Navigator.share` as an always-defined method, so the truthy check is
   * flagged by `strictNullChecks`-aware linters as "always true". The
   * `typeof` guard is the spec-recommended way to feature-detect.
   */
  async function nativeShare() {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ title: bookTitle, text, url })
      } catch {
        // User dismissed the share sheet, or share failed. Fall back to
        // the in-page popover so they can still copy a link / share manually.
        setOpen(true)
      }
    } else {
      setOpen(true)
    }
  }

  function shareToTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function shareToTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.preventDefault()
            // Always go through `nativeShare()` — it feature-detects the Web
            // Share API itself and falls back to opening the popover.
            nativeShare()
          }}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">اشتراک‌گذاری</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
          اشتراک‌گذاری کتاب
        </p>
        <div className="space-y-1">
          <button
            onClick={shareToTwitter}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Twitter className="h-4 w-4 text-gold-500" />
            توییتر
          </button>
          <button
            onClick={shareToTelegram}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Send className="h-4 w-4 text-gold-500" />
            تلگرام
          </button>
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Link2 className="h-4 w-4 text-muted-foreground" />
            )}
            {copied ? 'کپی شد!' : 'کپی لینک'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
