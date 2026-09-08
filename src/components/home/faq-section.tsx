import { ChevronDown, HelpCircle } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  items: FaqItem[]
}

export function FaqSection({ items }: FaqSectionProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Section header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          سوالات متداول
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          پرسش‌های شما، پاسخ ما
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          هر آنچه باید درباره بوکزی بدانید — از ویژگی‌ها و سطوح تا نحوه یادگیری زبان
        </p>
      </div>

      {/* Accordion items — pure native HTML details/summary for instant, zero-JS interaction */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <details
            key={item.question}
            open={i === 0}
            className="group overflow-hidden rounded-2xl border border-border/60 bg-card/50 transition-colors open:border-gold-500/40 open:bg-gold-500/5 hover:border-gold-500/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-right select-none sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700 transition-colors group-open:bg-gold-500 group-open:text-white dark:text-gold-400">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-foreground sm:text-base">
                  {item.question}
                </span>
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="px-4 pb-4 pr-16 sm:px-5 sm:pb-5 sm:pr-16">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* Bottom CTA — link to /help for more */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        سوال دیگری دارید؟{' '}
        <a
          href="/help"
          className="font-semibold text-gold-700 underline-offset-2 hover:underline dark:text-gold-400"
        >
          صفحه راهنما را ببینید
        </a>{' '}
        یا{' '}
        <a
          href="/support"
          className="font-semibold text-gold-700 underline-offset-2 hover:underline dark:text-gold-400"
        >
          با ما تماس بگیرید
        </a>
        .
      </p>
    </section>
  )
}

