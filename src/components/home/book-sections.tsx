import Link from 'next/link'
import dynamic from 'next/dynamic'

const BookCarousel = dynamic(
  () => import('@/components/books/book-carousel').then((m) => m.BookCarousel),
  { ssr: true },
)

import { LazyReveal } from '@/components/home/lazy-reveal'
import { ChevronLeft, Eye, Sparkles, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BookListItem } from '@/lib/data'

interface SectionMeta {
  /** Lucide icon rendered inside the gold chip.
   *  Per user feedback: the numbered badge (1/2/3) was removed — only
   *  the icon stays, so the section reads cleaner. */
  icon: LucideIcon
  title: string
  subtitle: string
}

/**
 * Section header used by the three book carousels on the home page.
 *
 * Per user feedback:
 *   • Removed the numbered badge (1/2/3) — only the gold icon chip remains.
 *   • Subtitles now relate directly to their title.
 */
function BookSectionHeader({ meta }: { meta: SectionMeta }) {
  const Icon = meta.icon
  return (
    <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Icon-only gold chip */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-11 sm:w-11">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 opacity-30 blur-md"
          />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 text-white shadow-md sm:h-11 sm:w-11">
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="space-y-0.5">
          <h2 className="text-base font-extrabold tracking-tight sm:text-2xl">
            {meta.title}
          </h2>
          {meta.subtitle && (
            <p className="text-xs text-muted-foreground sm:text-sm">{meta.subtitle}</p>
          )}
        </div>
      </div>
      <Link
        href="/library"
        prefetch={false}
        className="group/more inline-flex items-center gap-0.5 text-xs font-semibold text-gold-700 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300 sm:text-sm"
        aria-label={`مشاهده همه ${meta.title}`}
      >
        <span>مشاهده همه</span>
        <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-300 ease-out-expo group-hover/more:-translate-x-1 sm:h-4 sm:w-4" />
      </Link>
    </div>
  )
}

function makeCarousel(meta: SectionMeta, books: BookListItem[]) {
  return (
    <LazyReveal>
      <section className="mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-12">
        <BookSectionHeader meta={meta} />
        <BookCarousel books={books} />
      </section>
    </LazyReveal>
  )
}

export function RecentlyAddedBooks({ books }: { books: BookListItem[] }) {
  return makeCarousel(
    {
      icon: Sparkles,
      title: 'تازه اضافه شده',
      subtitle: 'آخرین کتاب‌هایی که به بوکزی اضافه شده‌اند',
    },
    books,
  )
}

export function HighestRatedBooks({ books }: { books: BookListItem[] }) {
  return makeCarousel(
    {
      icon: Star,
      title: 'بالاترین امتیاز',
      subtitle: 'کتاب‌هایی که خوانندگان بیشترین امتیاز را به آن‌ها داده‌اند',
    },
    books,
  )
}

export function MostReadBooks({ books }: { books: BookListItem[] }) {
  return makeCarousel(
    {
      icon: Eye,
      title: 'پرخواننده‌ترین',
      subtitle: 'کتاب‌هایی که بیشترین تعداد خواننده داشته‌اند',
    },
    books,
  )
}
