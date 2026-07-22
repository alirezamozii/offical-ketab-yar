'use client'

/**
 * SkipLink — accessibility affordance for keyboard & screen-reader users.
 *
 * This is rendered as the very first child of <body> (see app/layout.tsx),
 * which makes it the first focusable element on every page. Visually hidden
 * until focused (:focus-visible), then appears top-center as a high-contrast
 * pill so keyboard users can bypass the header/nav and jump straight to
 * `#main-content` (set on the <main> element in ConditionalLayout).
 *
 * WCAG 2.1 SC 2.4.1 (Bypass Blocks) — implemented via in-page anchor.
 * WCAG 2.1 SC 2.4.7 (Focus Visible) — the link reveals itself on focus
 *   and keeps a visible ring while focused.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      // Persian text — "Skip to main content".
      // The link is screen-reader-only by default and becomes visible
      // on focus. `focus:outline-none` is intentionally NOT used — we
      // rely on the global `:focus-visible` ring from globals.css so the
      // affordance is always visible to keyboard users.
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-3 focus:left-1/2 focus:z-[100]
        focus:-translate-x-1/2
        focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2
        focus:text-sm focus:font-semibold focus:text-primary-foreground
        focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
      "
    >
      رفتن به محتوای اصلی
    </a>
  )
}
