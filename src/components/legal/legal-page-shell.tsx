/**
 * LegalPageShell — shared layout for the /terms, /privacy, /cookies and
 * /dmca pages.
 *
 * All four legal pages share the same visual structure:
 *   1. A centered header (icon + title + subtitle + "last updated" badge).
 *   2. A sticky table-of-contents (right rail on lg+, horizontal scroll on
 *      mobile) for fast in-page navigation.
 *   3. A sequence of Card-wrapped sections (one <LegalSection> per topic).
 *
 * Keeping the shell in one place means a future update to the legal layout
 * (typography, color, sticky behaviour) only touches one file.
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { LucideIcon } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'

export interface LegalSectionData {
  /** Anchor id, used by the TOC + the section heading. */
  id: string
  /** Heading text (Persian). */
  title: string
  /** Body — JSX so we can use paragraphs, lists, links, callouts. */
  body: React.ReactNode
}

interface LegalPageShellProps {
  icon: LucideIcon
  title: string
  subtitle: string
  /** Persian date string, e.g. "۲۲ تیر ۱۴۰۴". */
  lastUpdated: string
  /** Sections to render + wire into the TOC. */
  sections: LegalSectionData[]
  /** Optional CTA at the bottom (usually a "contact support" link). */
  footerCta?: React.ReactNode
}

export function LegalPageShell({
  icon: Icon,
  title,
  subtitle,
  lastUpdated,
  sections,
  footerCta,
}: LegalPageShellProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="mb-8 space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
          <Icon className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">{subtitle}</p>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-700 dark:text-gold-300">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          آخرین بروزرسانی: {lastUpdated}
        </p>
      </header>

      {/* ── Body: TOC (rail) + sections ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Table of contents — sticky on lg+, horizontal scroll on mobile. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav
            aria-label="فهرست بخش‌ها"
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">
              فهرست
            </p>
            <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
              {sections.map((s, i) => (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <Link
                    href={`#${s.id}`}
                    className="flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-gold-500/10 hover:text-foreground lg:whitespace-normal"
                  >
                    <span className="tabular-nums text-gold-600 dark:text-gold-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-2">{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Sections list — one Card per topic. */}
        <div className="space-y-5">
          {sections.map((s, i) => (
            <Card
              key={s.id}
              id={s.id}
              className="scroll-mt-24 border-border/60 shadow-sm"
            >
              <CardHeader>
                <CardTitle className="flex items-baseline gap-3 text-lg">
                  <span className="font-mono text-sm font-bold text-gold-600 dark:text-gold-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{s.title}</span>
                </CardTitle>
              </CardHeader>
              <Separator className="bg-border/60" />
              <CardContent className="space-y-3 text-sm leading-7 text-foreground/90">
                {s.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {footerCta ? (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {footerCta}
        </div>
      ) : null}
    </div>
  )
}

/* ── Re-usable bits for section bodies ─────────────────────────────────────────
 * Small primitives so the section bodies in the page files stay readable.
 * Using <P>, <Ul>, <Li>, <Callout> instead of raw <p>/<ul>/<li> keeps the
 * spacing consistent and makes it obvious which markup is "legal-page prose"
 * vs. page chrome.
 */

export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-7 text-foreground/90">{children}</p>
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pr-5">{children}</ul>
}

export function Li({ children }: { children: React.ReactNode }) {
  return <li className="leading-7 text-foreground/90">{children}</li>
}

export function Callout({
  children,
  tone = 'gold',
}: {
  children: React.ReactNode
  tone?: 'gold' | 'warning'
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-500/40 bg-amber-500/8 text-amber-900 dark:text-amber-200'
      : 'border-gold-500/40 bg-gold-500/8 text-gold-900 dark:text-gold-200'
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-xs leading-6 ${toneClass}`}
    >
      {children}
    </div>
  )
}

export function ContactLine({ email }: { email: string }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <ChevronLeft className="h-3 w-3 rotate-180 text-gold-500" />
      سوال دیگری دارید؟ به{' '}
      <a
        href={`mailto:${email}`}
        className="font-medium text-gold-700 underline-offset-4 hover:underline dark:text-gold-300"
        dir="ltr"
      >
        {email}
      </a>{' '}
      ایمیل بزنید.
    </p>
  )
}
