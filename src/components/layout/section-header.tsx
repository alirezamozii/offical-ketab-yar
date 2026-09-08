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
        'mb-4 flex items-center justify-between gap-3 sm:mb-5',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {Icon && (
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-11 sm:w-11">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 opacity-30 blur-md"
            />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 text-white shadow-md sm:h-11 sm:w-11">
              <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        )}
        <div className="space-y-0.5">
          <h2 className="text-base font-extrabold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {ornament && (
            <div
              aria-hidden="true"
              className="h-0.5 w-8 rounded-full bg-gradient-to-r from-gold-400 to-gold-700 sm:w-10"
            />
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}
