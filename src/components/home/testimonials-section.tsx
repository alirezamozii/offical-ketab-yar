import { DeferredTestimonialsCarousel } from '@/components/home/deferred-testimonials-carousel'

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 space-y-3 text-center">
        <span className="inline-block rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-400">
          تجربه استفاده
        </span>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          با بوکزی چه‌کار می‌توان کرد؟
        </h2>
        <p className="mx-auto max-w-2xl text-xs text-muted-foreground sm:text-sm">
          یک نگاه سریع به کارهایی که هر روز می‌توانید با بوکزی انجام دهید.
        </p>
      </div>

      <DeferredTestimonialsCarousel />
    </section>
  )
}

