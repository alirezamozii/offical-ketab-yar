'use client'

import dynamic from 'next/dynamic'
import { Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const TestimonialsCarousel = dynamic(
  () => import('@/components/home/testimonials-carousel').then((m) => m.TestimonialsCarousel),
  { ssr: false },
)

function StaticFirstTestimonial() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-gold-500/20 bg-card/60 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
          <Languages aria-hidden="true" className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">مطالعه دوزبانه</h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        پاراگراف انگلیسی را می‌خوانم، نگاهی به ترجمه فارسی کنارش می‌اندازم و دوباره به متن اصلی برمی‌گردم. درک کلیِ متن سریع‌تر اتفاق می‌افتد.
      </p>
    </div>
  )
}

export function DeferredTestimonialsCarousel() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setInteractive(true)
        observer.disconnect()
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef}>
      {interactive ? <TestimonialsCarousel /> : <StaticFirstTestimonial />}
    </div>
  )
}
