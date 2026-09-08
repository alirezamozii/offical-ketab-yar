'use client'

import { ChevronDown, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface FaqItem {
  question: string
  answer: string
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
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="motion-safe:animate-[testimonialFade_200ms_ease-out_both]"
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pr-16 sm:px-5 sm:pb-5 sm:pr-16">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.question}
        >
          <AccordionItem
            item={item}
            index={i}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        </div>
      ))}
    </div>
  )
}
