import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Compass,
  Home,
  Library,
  Search,
  Trophy,
  User,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

/**
 * Root 404 page (`/not-found`).
 *
 * Rendered by Next.js whenever `notFound()` is called anywhere in the route
 * tree, or when no route matches the URL. Marked `noindex` so search engines
 * don't index the bare 404 URL (the underlying missing page is irrelevant —
 * they should index real content pages, not the error screen).
 *
 * Includes:
 *   • Friendly Persian headline + sub-message
 *   • Large 404 illustration (gold gradient)
 *   • Two primary actions: home + search
 *   • "شاید منظورتان این بود:" list of popular destinations (so a user who
 *     typed /book/... instead of /books/... has a quick recovery path)
 */
export const metadata: Metadata = {
  title: 'صفحه یافت نشد',
  description: 'صفحه‌ای که به دنبال آن بودید پیدا نشد. شاید آدرس را اشتباه وارد کرده‌اید.',
  robots: { index: false, follow: true },
}

const SUGGESTIONS: Array<{
  href: string
  label: string
  description: string
  icon: typeof Home
}> = [
  {
    href: '/',
    label: 'خانه',
    description: 'معرفی کتاب‌یار و کتاب‌های منتخب',
    icon: Home,
  },
  {
    href: '/library',
    label: 'کتابخانه',
    description: 'مرور همهٔ کتاب‌های موجود',
    icon: Library,
  },
  {
    href: '/search',
    label: 'جستجو',
    description: 'جست‌وجوی متن دوزبانه و عنوان کتاب‌ها',
    icon: Search,
  },
  {
    href: '/leaderboard',
    label: 'لیدربورد',
    description: 'رتبه‌بندی کاربران بر اساس تجربه',
    icon: Trophy,
  },
  {
    href: '/library/genres',
    label: 'ژانرها',
    description: 'کاوش بر اساس دسته‌بندی',
    icon: Compass,
  },
  {
    href: '/dashboard',
    label: 'داشبورد',
    description: 'خلاصهٔ پیشرفت مطالعه شما',
    icon: User,
  },
]

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      {/* soft warm glow */}
      <div
        aria-hidden
        className="absolute top-1/4 -z-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
      />

      {/* Brand wordmark */}
      <span className="mb-8 text-gradient-gold text-sm font-bold tracking-wide">
        کتاب‌یار
      </span>

      {/* 404 illustration */}
      <p
        aria-hidden="true"
        className="bg-gradient-to-l from-gold-400 via-gold-500 to-gold-700 bg-clip-text text-8xl font-extrabold text-transparent sm:text-9xl"
      >
        ۴۰۴
      </p>

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        صفحه یافت نشد
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        صفحه‌ای که دنبالش بودید پیدا نشد. شاید آدرس را اشتباه وارد کرده‌اید
        یا این صفحه دیگر در دسترس نیست.
      </p>

      {/* Primary actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="glow" size="lg">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            بازگشت به خانه
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/search">
            <Search className="h-4 w-4" aria-hidden="true" />
            جست‌وجوی کتاب
          </Link>
        </Button>
      </div>

      {/* "شاید منظورتان این بود:" suggestions */}
      <section className="mt-14 w-full" aria-labelledby="not-found-suggestions">
        <h2
          id="not-found-suggestions"
          className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          شاید منظورتان این بود:
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 text-right transition-[transform,opacity,colors,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-gold-500/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gold-500/15 text-gold-600 dark:text-gold-400">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-bold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
