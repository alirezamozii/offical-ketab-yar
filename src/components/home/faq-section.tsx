import { HelpCircle } from 'lucide-react'
import { FaqAccordion, type FaqItem } from '@/components/home/faq-client'

export type { FaqItem }

interface FaqSectionProps {
  items: FaqItem[]
}

export function FaqSection({ items }: FaqSectionProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Section header */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          سوالات متداول
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          پرسش‌های شما، پاسخ ما
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          هر آنچه باید درباره کتاب‌یار بدانید — از قیمت و ویژگی‌ها تا نحوه یادگیری زبان
        </p>
      </div>

      {/* Accordion items */}
      <FaqAccordion items={items} />

      {/* Bottom CTA — link to /help for more */}
      <p className="mt-8 text-center text-sm text-muted-foreground animate-in fade-in duration-700 delay-300 fill-mode-both">
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

