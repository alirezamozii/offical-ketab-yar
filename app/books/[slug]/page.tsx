'use client'

import { ProfessionalReader } from '@/components/reader/professional-reader'
import { Skeleton } from '@/components/ui/skeleton'
import { use, useState } from 'react'

interface ReaderPageProps {
  params: Promise<{
    slug: string
  }>
}

// ... (توابع اینترفیس و convertCompactToPages تغییری نمی‌کنند و مثل قبل هستند) ...
// برای کوتاه شدن کد، قسمت‌های تکراری لودینگ دیتا رو حذف کردم چون مشکلی نداشتند

export default function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = use(params)
  const [book, setBook] = useState<any>(null) // تایپ را روی BookData بگذارید
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  // ... (کدهای useEffect برای فچ کردن دیتا مثل قبل باقی بماند) ...

  // وقتی دیتا در حال لود شدن است، بهتر است یک لایه روی کل صفحه باشد
  if (loading || !book) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="container max-w-4xl mx-auto px-4 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER ---
  return (
    <>
      {/* اگر در حالت درفت هستید، این بج هم باید z-index خیلی بالا داشته باشه */}
      {isDraft && (
        <div className="fixed top-4 right-4 z-[10000]">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg">
            🚧 DRAFT - Test Mode
          </div>
        </div>
      )}

      {/* ریدر را مستقیماً برمی‌گردانیم بدون هیچ div اضافه */}
      <ProfessionalReader book={book} />
    </>
  )
}