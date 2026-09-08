'use client'

import { Button } from '@/components/ui/button'
import { Dices } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * RandomBookButton — "Feeling Lucky"-style CTA. Fetches the full book list
 * from /api/books, picks one at random, and routes the user straight into
 * the reader (/books/read/[slug]) with no intermediate page.
 */
export function RandomBookButton({
  className,
  size = 'default',
}: {
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'xl'
} = {}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function pickRandom() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/books')
      const books = await res.json()
      if (!Array.isArray(books) || books.length === 0) {
        router.push('/library')
        return
      }
      const random = books[Math.floor(Math.random() * books.length)]
      router.push(`/books/read/${random.slug}`)
    } catch {
      router.push('/library')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={className || "w-full text-sm sm:text-base sm:w-auto"}
      onClick={pickRandom}
      disabled={loading}
      aria-label="کتاب تصادفی — مستقیم وارد ریدر شوید"
    >
      <Dices aria-hidden="true" className={loading ? 'h-4 w-4 sm:h-5 sm:w-5 animate-spin' : 'h-4 w-4 sm:h-5 sm:w-5'} />
      {loading ? 'در حال انتخاب…' : 'کتاب تصادفی'}
    </Button>
  )
}
