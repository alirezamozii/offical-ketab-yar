'use client'

import Link from 'next/link'
import {
  BookOpen,
  ChevronUp,
  Github,
  Heart,
  Instagram,
  Send,
  Twitter,
  Banana,
} from 'lucide-react'
import { BackToTop } from '@/components/layout/back-to-top'
import { NewsletterSignup } from '@/components/layout/newsletter-signup'
import { SITE } from '@/lib/site'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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
    title: 'کتاب‌یار',
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
  { Icon: Twitter, label: 'توییتر کتاب‌یار', href: SITE.social.twitter },
  { Icon: Instagram, label: 'اینستاگرام کتاب‌یار', href: SITE.social.instagram },
  { Icon: Send, label: 'تلگرام کتاب‌یار', href: SITE.social.telegram },
  { Icon: Github, label: 'گیت‌هاب کتاب‌یار', href: SITE.social.github },
]

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md'

/**
 * EasterEggHeart — per user feedback: the heart icon morphs to a BANANA
 * on click (not a book). Both have a glow. Real framer-motion animation.
 *
 * Per user feedback: "این کتابه هم گقتم از فوتر بره به حاش موز BENANAN
 * باشه" — the morph target is a banana 🍌, not a book.
 */
function EasterEggHeart() {
  const [morphed, setMorphed] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setMorphed((v) => !v)}
      aria-label={morphed ? 'بازگشت به قلب' : 'ساخته شده با عشق — کلیک کنید'}
      title={morphed ? 'موز' : 'عشق'}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 active:scale-95 tap-target"
    >
      {/* Soft glow halo — both heart and banana have a glow. Color morphs
          from red to yellow during the transition. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-md"
        animate={{
          backgroundColor: morphed
            ? 'rgba(250, 204, 21, 0.5)'
            : 'rgba(239, 68, 68, 0.4)',
          opacity: morphed ? 0.8 : 0.6,
          scale: morphed ? 1.1 : 1,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />
      {/* Crossfade morph: old icon exits while new icon enters. */}
      <AnimatePresence mode="wait" initial={false}>
        {morphed ? (
          <motion.span
            key="banana"
            className="relative inline-flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.3, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.3, rotate: 90 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Banana className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
          </motion.span>
        ) : (
          <motion.span
            key="heart"
            className="relative inline-flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.3, rotate: 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.3, rotate: -90 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

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
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-5 md:gap-5">
          {/* Brand column */}
          <div className="space-y-2.5">
            <Link
              href="/"
              aria-label="کتاب‌یار — خانه"
              className={`flex items-center gap-2.5 ${FOCUS_RING}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold">کتاب‌یار</span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground text-balance">
              همراه هوشمند مطالعه دوزبانه. کتاب‌های انگلیسی را با ترجمه فارسی،
              دیکشنری و هوش مصنوعی بخوانید.
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

          {/* Link columns — on mobile, render in a 2-col grid to save
              vertical space. On sm+, they flow into the parent 4-col grid. */}
          {LINKS.map((col) => (
            <div key={col.title} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                {col.title}
              </h3>
              <ul className="space-y-1.5">
                {col.items.map((item) => (
                  <li key={`${col.title}-${item.label}`}>
                    {item.href === '#top' ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                          })
                        }
                        className={`flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary ${FOCUS_RING}`}
                        aria-label="بازگشت به بالای صفحه"
                      >
                        <ChevronUp className="h-3 w-3" />
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={`text-xs text-muted-foreground transition-colors hover:text-primary ${FOCUS_RING}`}
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

        {/* ─── Bottom bar ───
            Per user feedback: "© 2026 کتاب‌یار — تمام حقوق محفوظ است.
            ساخته شده با برای علاقه‌مندان به کتاب اینم باید به شکل وسط
            چین باشه" — center-aligned on all breakpoints. */}
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground sm:mt-6">
          <p>© {new Date().getFullYear()} کتاب‌یار — تمام حقوق محفوظ است.</p>
          <p className="flex items-center justify-center gap-1.5">
            ساخته شده با
            <EasterEggHeart />
            برای علاقه‌مندان به کتاب
          </p>
        </div>
      </div>

      {/* Floating back-to-top button (client island) */}
      <BackToTop />
    </footer>
  )
}
