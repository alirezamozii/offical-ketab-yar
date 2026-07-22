/**
 * Decorative horizontal divider between major sections — a gold gradient
 * line with a centered diamond/dot ornament. Hidden from screen readers
 * (purely decorative).
 *
 * The line uses a soft `via-border` for the gradient body and a brighter
 * `via-gold-500/50` overlay at the center to draw the eye toward the
 * diamond. The diamond is a rotated 8px square with a gold gradient fill
 * and a subtle gold ring, so it reads as a small jewel rather than a
 * plain dot.
 *
 * Variants:
 *   • `default` — the standard 1px line + diamond (most sections).
 *   • `wide`    — taller gradient band (used between hero and the first
 *                  content section, where more visual breathing room helps).
 */
export function SectionDivider({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'wide'
}) {
  if (variant === 'wide') {
    return (
      <div
        aria-hidden="true"
        className={`relative mx-auto h-12 w-full max-w-7xl ${className ?? ''}`}
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        <div className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 bg-gradient-to-b from-transparent via-gold-500/[0.06] to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-gradient-to-br from-gold-300 to-gold-600 shadow-sm shadow-gold-500/40 ring-1 ring-gold-500/30" />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-px w-full max-w-7xl ${className ?? ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      {/* Brighter gold overlay at the center */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-60" />
      {/* Centered diamond ornament */}
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-gradient-to-br from-gold-300 to-gold-600 shadow-sm shadow-gold-500/40 ring-1 ring-gold-500/30" />
    </div>
  )
}
