import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  /**
   * Optional icon shown in a gold-gradient chip to the start of the title.
   * Per user feedback, all home-page section headers should have an icon
   * so the section is recognizable at a glance.
   */
  icon?: LucideIcon
  /**
   * `default` — text-only header (the common case).
   * `ornament` — adds a small gold underline ornament under the title for
   *   sections that need more visual hierarchy (e.g. the home page's
   *   primary content sections).
   */
  ornament?: boolean
}

/**
 * SectionHeader — consistent heading styles across sections.
 *
 * Title is `text-xl sm:text-2xl font-bold tracking-tight`. Subtitle is
 * `text-sm text-muted-foreground`. The `action` slot is right-aligned on
 * `sm+` and wraps below on mobile.
 *
 * When `icon` is provided, a gold-gradient icon chip is rendered to the
 * start of the title — same visual language as the BookSectionHeader so
 * every section on the home page has a consistent icon+title+subtitle
 * pattern (per user feedback).
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  icon: Icon,
  ornament = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 opacity-30 blur-md"
            />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 text-white shadow-md">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {ornament && (
            <div
              aria-hidden="true"
              className="h-0.5 w-10 rounded-full bg-gradient-to-r from-gold-400 to-gold-700"
            />
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}
