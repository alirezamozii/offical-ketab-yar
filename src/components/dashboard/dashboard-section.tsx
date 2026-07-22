'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  /** stagger index — used for entrance animation delay */
  index?: number
  className?: string
  children: React.ReactNode
}

/**
 * Standard section wrapper for the dashboard. Provides:
 * - Icon + title + optional subtitle header row
 * - Optional action (e.g. "کتابخانه" link)
 * - Staggered entrance animation
 * - Consistent spacing
 */
export function DashboardSection({
  icon: Icon,
  title,
  subtitle,
  action,
  index = 0,
  className,
  children,
}: DashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.05, 0.4),
        duration: 0.4,
        ease: 'easeOut',
      }}
      className={cn('space-y-4', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  )
}
