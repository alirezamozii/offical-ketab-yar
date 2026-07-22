'use client'

import { Button } from '@/components/ui/button'
import { isBookFullyCached, prefetchBook } from '@/lib/book-prefetcher'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DownloadBookButtonProps {
  slug: string
  title: string
  pageCount: number
}

export function DownloadBookButton({ slug, title, pageCount }: DownloadBookButtonProps) {
  const [cached, setCached] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setCached(isBookFullyCached(slug))
  }, [slug])

  const handleDownload = async () => {
    if (downloading || cached) return
    setDownloading(true)
    setProgress(0)

    try {
      await prefetchBook(slug, title, pageCount, (p) => {
        setProgress(p)
      })
      setCached(true)
      toast.success('کتاب با موفقیت دانلود شد!', {
        description: 'اکنون می‌توانید این کتاب را به‌صورت کاملاً آفلاین مطالعه کنید.',
      })
    } catch (err) {
      toast.error('دانلود ناموفق بود', {
        description: 'لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (cached) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="gap-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
        disabled
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        دانلود شده (آماده آفلاین)
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleDownload}
      disabled={downloading}
      className="gap-2 border-gold-500/30 text-gold-700 hover:bg-gold-500/10 dark:text-gold-400"
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال دانلود... {progress}٪
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          دانلود برای مطالعه آفلاین
        </>
      )}
    </Button>
  )
}
