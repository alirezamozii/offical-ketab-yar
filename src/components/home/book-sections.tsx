import Link from 'next/link'
import { BookCarousel } from '@/components/books/book-carousel'
import { Button } from '@/components/ui/button'
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
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Icon-only gold chip — number badge removed per user feedback */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 opacity-30 blur-md"
          />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 text-white shadow-md">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {meta.title}
          </h2>
          {meta.subtitle && (
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
          )}
        </div>
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="group/more hidden text-primary sm:inline-flex"
        aria-label={`مشاهده همه ${meta.title}`}
      >
        <Link href="/library">
          مشاهده همه
          <ChevronLeft className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover/more:-translate-x-1" />
        </Link>
      </Button>
    </div>
  )
}

function makeCarousel(meta: SectionMeta, books: BookListItem[]) {
  return (
    <LazyReveal>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
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
      subtitle: 'آخرین کتاب‌هایی که به کتاب‌یار اضافه شده‌اند',
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
