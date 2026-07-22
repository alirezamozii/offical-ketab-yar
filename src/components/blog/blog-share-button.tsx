'use client'

/**
 * BlogShareButton — share affordance for `/blog/[slug]` pages.
 *
 * Similar in spirit to the book `ShareButton` but with blog-specific copy
 * and a `slug + title`-only API. Uses the Web Share API when available
 * (mobile / Safari / Chrome Android) and falls back to an in-page
 * popover with Twitter / Telegram / copy-link actions on desktop.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, Link2, Send, Share2, Twitter } from 'lucide-react'
import { toast } from 'sonner'

interface BlogShareButtonProps {
  slug: string
  title: string
}

export function BlogShareButton({ slug, title }: BlogShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/blog/${slug}`
      : `/blog/${slug}`
  const text = `«${title}» — مقاله کتاب‌یار درباره یادگیری زبان با کتاب`

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

  async function nativeShare() {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ title, text, url })
      } catch {
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
            nativeShare()
          }}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">اشتراک‌گذاری</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
          اشتراک‌گذاری مقاله
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
