'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

/**
 * Removable chip row shown above the book grid. Each chip represents a single
 * active filter (search query, genre, level, status, sort). Clicking the X
 * clears that one filter without touching the others.
 *
 * Premium touches:
 *   - Each chip slides + fades in on mount (framer-motion, gated by reduced
 *     motion) with a tiny stagger so the row "assembles" rather than popping.
 *   - The X icon rotates 90° on hover for tactile feedback.
 *   - The "حذف همه" link sits at the end of the row, separated by a faint
 *     vertical divider, so it doesn't compete with the individual chips.
 */
export function ActiveFilterChips({
  filters,
  onClearAll,
}: {
  filters: ActiveFilter[]
  onClearAll?: () => void
}) {
  const reduceMotion = useReducedMotion()
  if (filters.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">فیلترهای فعال:</span>
      {filters.map((f, i) => (
        <motion.button
          key={f.key}
          type="button"
          onClick={f.onRemove}
          initial={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.2),
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            'group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1',
            'text-xs font-medium text-primary transition-colors hover:bg-primary/20',
          )}
          aria-label={`حذف فیلتر ${f.label}`}
        >
          <span>{f.label}</span>
          <X className="h-3 w-3 transition-transform duration-200 group-hover:rotate-90" />
        </motion.button>
      ))}
      {onClearAll && filters.length > 1 && (
        <>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            پاک کردن فیلترها
          </button>
        </>
      )}
    </div>
  )
}
