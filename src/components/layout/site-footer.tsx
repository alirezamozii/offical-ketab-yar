import Link from 'next/link'
import {
  BookOpen,
  ChevronUp,
  Github,
  Instagram,
  Send,
  Twitter,
} from 'lucide-react'
import { NewsletterSignup } from '@/components/layout/newsletter-signup'
import { EasterEggHeart } from '@/components/layout/easter-egg-heart'
import { SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

type LinkItem = { label: string; href: string }
type LinkColumn = { title: string; items: LinkItem[] }

const LINKS: LinkColumn[] = [
  {
    title: 'کاوش',
    items: [
      { label: 'کتابخانه', href: '/library' },
      { label: 'پرفروش‌ترین‌ها', href: '/library?sort=rating' },
      { label: 'جدیدترین‌ها', href: '/library?sort=recent' },
      { label: 'جستجو', href: '/search' },
    ],
  },
  {
    title: 'یادگیری',
    items: [
      { label: 'واژگان من', href: '/vocabulary' },
      { label: 'تمرین واژگان', href: '/vocabulary/practice' },
      { label: 'داشبورد', href: '/dashboard' },
      { label: 'لیدربورد', href: '/leaderboard' },
    ],
  },
  {
    title: 'بوکزی',
    items: [
      { label: 'درباره ما', href: '/about' },
      { label: 'پشتیبانی', href: '/support' },
      { label: 'سوالات متداول', href: '/help' },
      { label: 'بازگشت به بالا', href: '#top' },
    ],
  },
  {
    title: 'قوانین و مقررات',
    items: [
      { label: 'شرایط استفاده', href: '/terms' },
      { label: 'حریم خصوصی', href: '/privacy' },
      { label: 'سیاست کوکی', href: '/cookies' },
      { label: 'کپی‌رایت (DMCA)', href: '/dmca' },
    ],
  },
]

/** Social links — rendered as icon buttons in the brand column. */
const SOCIAL: { Icon: typeof Twitter; label: string; href: string }[] = [
  { Icon: Twitter, label: 'توییتر بوکزی', href: SITE.social.twitter },
  { Icon: Instagram, label: 'اینستاگرام بوکزی', href: SITE.social.instagram },
  { Icon: Send, label: 'تلگرام بوکزی', href: SITE.social.telegram },
  { Icon: Github, label: 'گیت‌هاب بوکزی', href: SITE.social.github },
]

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md'


/**
 * SiteFooter — REDESIGNED per user feedback.
 *
 * Per user feedback:
 *   • "این سکشن فوتر هم به شدت بده و بیا درست ش کن مرتب تر باشه و مناسب
 *     زوی گوشی که حیلی بده" — mobile layout was bad, needed to be
 *     more organized.
 *   • "اون پایین راس زبان تعیر میدیم اون بخش به کل پاک کن زبان دیگه
 *     نمیخوام" — language switcher already removed (confirmed).
 *   • "بخش اخر فوتر هم باید تو LAYOUT بشع نه اینخوری المی فوتر حای زیادی
 *     گرفتیم و مرتب هم نیستیم" — footer took too much space, was messy.
 *   • "بثیه چیزای یکه کفتم نمیخوایم هم پاک کن" — removed unwanted items.
 *
 * Layout (mobile-first):
 *   • Mobile (default): single column — brand + social, then links in a
 *     2-col grid, then a compact bottom bar.
 *   • sm+: 2 columns — brand on right, links on left.
 *   • md+: 4 columns — brand | link-col-1 | link-col-2 | link-col-3.
 *
 * The footer is now much more compact (reduced py, tighter gaps) so it
 * doesn't dominate the page on mobile.
 */
export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="پانویس سایت"
      className="mt-auto border-t border-border/70 bg-gradient-to-b from-transparent to-gold-500/5"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {/* ─── Top section ───
            Mobile-first grid:
              - Mobile: 1 col (brand, then link cols stacked)
              - sm+: 2 col (brand | links-wrapper)
              - md+: 5 col (brand | link-1 | link-2 | link-3 | legal) */}
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-6">
          {/* Brand column */}
          <div className="space-y-3 lg:col-span-1">
            <Link
              href="/"
              prefetch={false}
              aria-label="بوکزی — خانه"
              className={`flex items-center gap-2.5 ${FOCUS_RING}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold">بوکزی</span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground text-balance">
              بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. مطالعه هوشمند رمان‌های انگلیسی با ترجمه فارسی، دیکشنری در لحظه و واژگان‌ساز.
            </p>

            {/* Social row */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary ${FOCUS_RING}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            {/* Newsletter signup — compact inline form */}
            <div className="pt-2">
              <NewsletterSignup />
            </div>
          </div>

          {/* Link columns — 2-column grid on mobile (grid-cols-2) for compact, clean layout */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-2 md:grid-cols-4 lg:col-span-4">
            {LINKS.map((col) => (
              <div key={col.title} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={`${col.title}-${item.label}`}>
                      {item.href === '#top' ? (
                        <a
                          href="#top"
                          className={`inline-flex items-center gap-1 py-1 text-xs text-muted-foreground transition-colors hover:text-primary ${FOCUS_RING}`}
                          aria-label="بازگشت به بالای صفحه"
                        >
                          <ChevronUp className="h-3 w-3" />
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          prefetch={false}
                          className={`inline-block py-1 text-xs text-muted-foreground transition-colors hover:text-primary ${FOCUS_RING}`}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Bottom bar ─── */}
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground sm:mt-6">
          <p>© {new Date().getFullYear()} بوکزی (Bookzi) — تمام حقوق محفوظ است.</p>
          <p className="flex items-center justify-center gap-1.5">
            ساخته شده با
            <EasterEggHeart />
            برای علاقه‌مندان به کتاب و یادگیری زبان
          </p>
        </div>
      </div>
    </footer>
  )
}
