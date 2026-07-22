'use client'

/**
 * src/components/home/faq-section.tsx
 * ---------------------------------------------------------------
 * Visible FAQ accordion section for the home page. The FAQ data
 * already exists as JSON-LD for SEO (8 Q&As in page.tsx), but was
 * NOT rendered visually — users couldn't see it. This component
 * surfaces that content in an accessible accordion.
 *
 * Design:
 *  - Gold-themed accordion with smooth expand/collapse (framer-motion)
 *  - Staggered entrance reveal
 *  - Accessible: button semantics, aria-expanded, keyboard navigable
 *  - Each item has a icon that rotates on open
 *  - Respects prefers-reduced-motion
 *
 * Owner: CRON-REVIEW-202607171255
 * ---------------------------------------------------------------
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  items: FaqItem[]
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const reduceMotion = useReducedMotion()
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        isOpen
          ? 'border-gold-500/40 bg-gold-500/5'
          : 'border-border/60 bg-card/50 hover:border-gold-500/30',
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 px-4 py-4 text-right sm:px-5 sm:py-5"
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
              isOpen
                ? 'bg-gold-500 text-white'
                : 'bg-gold-500/10 text-gold-700 dark:text-gold-400',
            )}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-foreground sm:text-base">
            {item.question}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
              isOpen ? 'rotate-180' : 'rotate-0',
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        initial={false}
        animate={
          reduceMotion
            ? { height: isOpen ? 'auto' : 0 }
            : {
                height: isOpen ? 'auto' : 0,
                opacity: isOpen ? 1 : 0,
              }
        }
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-4 pb-4 pr-16 sm:px-5 sm:pb-5 sm:pr-16">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {item.answer}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export function FaqSection({ items }: FaqSectionProps) {
  const reduceMotion = useReducedMotion()
  const [openIdx, setOpenIdx] = useState<number | null>(0) // first item open by default

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Section header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 text-center"
      >
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
      </motion.div>

      {/* Accordion items */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.question}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{
              duration: 0.4,
              delay: i * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <AccordionItem
              item={item}
              index={i}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA — link to /help for more */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 text-center text-sm text-muted-foreground"
      >
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
      </motion.p>
    </section>
  )
}
