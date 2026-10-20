import { BookOfTheDay } from '@/components/home/book-of-the-day'
import { safeJsonLd } from '@/lib/json-ld'
import { getQuoteOfTheDayFromDB } from '@/lib/cms'
import { CTASection } from '@/components/home/cta-section'
import { FaqSection, type FaqItem } from '@/components/home/faq-section'
import { GenresStrip } from '@/components/home/genres-strip'
import { HeroSection } from '@/components/home/hero-section'
import { QuoteOfTheDay } from '@/components/home/quote-of-the-day'
import { SectionDivider } from '@/components/home/section-divider'
import { StatsBar } from '@/components/home/stats-bar'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { SiteFooter } from '@/components/layout/site-footer'
import { ContinueReadingLoader } from '@/components/home/continue-reading-loader'
import dynamic from 'next/dynamic'

const HomePrefetcher = dynamic(
  () => import('@/components/home/home-prefetcher').then((m) => m.HomePrefetcher),
)
import {
  MostReadBooks,
  RecentlyAddedBooks,
} from '@/components/home/book-sections'
import {
  getCatalogStats,
  getMostReadBooks,
  getRecentlyAddedBooks,
} from '@/lib/data'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const revalidate = 0 // always fresh — new CMS content must appear on the next click

const SITE_URL = SITE.url

export const metadata: Metadata = {
  title: 'بوکزی | زیست‌بومِ کتاب‌های دوزبانه',
  description:
    'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. کتاب‌های انگلیسی را با ترجمه موازی فارسی، دیکشنری در لحظه، واژگان‌ساز و هوش مصنوعی بخوانید.',
  keywords: [
    'بوکزی',
    'Bookzi',
    'زیست‌بوم کتاب‌های دوزبانه',
    'کتاب انگلیسی',
    'مطالعه دوزبانه',
    'یادگیری زبان انگلیسی',
    'کتاب رایگان',
    'کتاب دوزبانه',
    'هوش مصنوعی',
    'دیکشنری هوشمند',
    'کتاب انگلیسی با ترجمه',
    'ترجمه فارسی کتاب',
    'bilingual English Persian books',
    'learn English with books',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_URL,
    siteName: 'بوکزی',
    title: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'کتاب‌های انگلیسی را با ترجمه پاراگراف‌به‌پاراگراف، دیکشنری هوشمند، واژگان‌ساز و استودیوی کوت بخوانید.',
    images: [
      {
        url: '/api/og?title=Bookzi&subtitle=Bilingual%20English%20books%20ecosystem',
        width: 1200,
        height: 630,
        alt: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی و هوش مصنوعی در بوکزی',
    images: ['/api/og?title=Bookzi&subtitle=Bilingual%20English%20books%20ecosystem'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default async function HomePage() {
  const [recent, mostRead, stats, quoteOfTheDay] = await Promise.all([
    getRecentlyAddedBooks(6),
    getMostReadBooks(6),
    getCatalogStats(),
    getQuoteOfTheDayFromDB(),
  ])

  const prefetchBooks = mostRead.slice(0, 3).map((b) => ({
    slug: b.slug,
    title: b.title,
    pageCount: b.pageCount,
  }))

  // Real catalog totals from cached database aggregate
  const booksCount = stats.booksCount
  const pagesCount = stats.pagesCount
  const totalReads = stats.totalReads
  const totalMinutes = stats.totalMinutes

  // --- Structured data: WebPage ----------------------------------------------
  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: 'بوکزی — زیست‌بومِ کتاب‌های دوزبانه',
    description:
      'بوکزی؛ زیست‌بومِ کتاب‌های دوزبانه. مطالعه هوشمند رمان‌های انگلیسی با ترجمه موازی، دیکشنری در لحظه، واژگان‌ساز و استودیوی کوت.',
    inLanguage: 'fa-IR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
  }

  // --- FAQ items (shared between JSON-LD + visible FaqSection) ---------------
  // Single source of truth so the SEO schema and the visible accordion
  // never drift apart. `allBooks.length` is interpolated at render time.
  const faqItems: FaqItem[] = [
    {
      question: 'آیا بوکزی رایگان است؟',
      answer:
        'بله، مطالعه کتاب‌های انگلیسی دوزبانه، دیکشنری هوشمند، ذخیره واژگان و کوت‌ها در بوکزی کاملاً رایگان است. بخش اصلی تجربه کاربری بدون محدودیت در اختیار شماست.',
    },
    {
      question: 'چگونه با بوکزی زبان انگلیسی یاد بگیرم؟',
      answer:
        'با مطالعه دوزبانه پاراگراف به پاراگراف، انتخاب کلمه برای دیدن معنی و تلفظ، ذخیره واژگان در واژگان‌ساز و تمرین منظم با سیستم تکرار با فاصله (SRS)، در همان حالی که کتاب می‌خوانید زبان یاد می‌گیرید.',
    },
    {
      question: 'آیا می‌توانم کتاب‌ها را دانلود کنم؟',
      answer:
        'بوکزی یک پلتفرم مطالعه آنلاین و وب‌اپلیکیشن تعاملی است. می‌توانید کتاب‌ها را به‌صورت دوزبانه در سایت مطالعه کنید و پیشرفت مطالعه‌تان به‌صورت خودکار ذخیره می‌شود تا ادامه کتاب را در هر دستگاهی از سر بگیرید.',
    },
    {
      question: 'چه کتاب‌هایی در بوکزی موجود است و برای چه سطوحی مناسب است؟',
      answer: `در حال حاضر ده‌ها کتاب انگلیسی در ژانرهای مختلف مانند آلیس در سرزمین عجایب، گتسبی بزرگ، داستان دو شهر و... با ترجمه فارسی، در سطوح مختلف از مبتدی تا پیشرفته موجود است و مرتباً کتاب‌های جدید اضافه می‌شود.`,
    },
    {
      question: 'هوش مصنوعی در بوکزی چطور کار می‌کند؟',
      answer:
        'ابزارهای هوشمند بوکزی شامل دیکشنری تعاملی با تلفظ صوتی، نمایش نقش کلمه، ترجمه دقیق متنی و استودیوی ساخت کارت کوت هستند.',
    },
    {
      question: 'سطوح کتاب‌ها در بوکزی چیست؟',
      answer:
        'کتاب‌ها بر اساس استاندارد CEFR در سطوح A1، A2، B1، B2 و C1 دسته‌بندی می‌شوند. در صفحه کتابخانه می‌توانید با فیلتر سطح، کتاب متناسب با توانایی زبانی خود را پیدا کنید.',
    },
    {
      question: 'آیا می‌توانم از بوکزی روی گوشی استفاده کنم؟',
      answer:
        'بله، بوکزی کاملاً ریسپانسیو و PWA است و می‌توانید آن را مستقیماً روی گوشی آیفون یا اندروید نصب کرده و مثل یک اپلیکیشن بومی مطالعه کنید.',
    },
    {
      question: 'استودیو کوت بوکزی چیست؟',
      answer:
        'در بوکزی می‌توانید هر جمله یا هایلایت جذاب از کتاب‌ها را به کارت‌های کاغذی بسیار شیک (کاغذ کرافت، ابسیدین شب، برگه‌های خط‌دار دفتری و سپیا) در ابعاد استوری یا پست تبدیل کرده و دانلود کنید.',
    },
  ]

  // --- Structured data: FAQPage (derived from the shared faqItems array) ------
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  // --- Structured data: ItemList (featured books on the page) -----------------
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#booklist`,
    name: 'کتاب‌های محبوب بوکزی',
    description: `فهرست کتاب‌های پرمطالعه انگلیسی دوزبانه در بوکزی — مطالعه رایگان با ترجمه فارسی، دیکشنری هوشمند و هوش مصنوعی.`,
    numberOfItems: mostRead.length,
    itemListElement: mostRead.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Book',
        '@id': `${SITE_URL}/books/${b.slug}#book`,
        name: b.title,
        url: `${SITE_URL}/books/${b.slug}`,
        author: { '@type': 'Person', name: b.author },
        inLanguage: ['en', 'fa'],
        bookEdition: 'Bilingual',
        bookFormat: 'https://schema.org/EBook',
        genre: b.genres,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: b.rating,
          bestRating: 5,
          worstRating: 1,
          ratingCount: b.reviewCount,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IRR',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <>
      <HeroSection booksCount={booksCount} />
      <StatsBar
        booksCount={booksCount}
        pagesCount={pagesCount}
        totalReads={totalReads}
        totalMinutes={totalMinutes}
      />

      <ContinueReadingLoader />
      <SectionDivider />

      {/* Book of the Day — daily curated recommendation */}
      <BookOfTheDay />
      <SectionDivider />

      {/* Per user feedback: moved "Most Read" up — right after Continue
          Reading so the user sees popular books immediately after their
          in-progress book. */}
      <MostReadBooks books={mostRead} />
      <SectionDivider />

      <RecentlyAddedBooks books={recent} />
      <SectionDivider />

      <GenresStrip />
      <SectionDivider />

      {/* Quote of the Day — deterministic daily literary quote with book link */}
      <QuoteOfTheDay quote={quoteOfTheDay} />
      <SectionDivider />

      <TestimonialsSection />
      <SectionDivider />

      {/* Visible FAQ accordion — the JSON-LD FAQPage schema has always
          existed for SEO, but the content was invisible to users. This
          section surfaces those 8 Q&As in an accessible accordion. */}
      <FaqSection items={faqItems} />
      <SectionDivider />

      <CTASection />
      <HomePrefetcher books={prefetchBooks} />
      <SiteFooter />

      <script
        id="home-webpage-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageLd) }}
      />
      <script
        id="home-faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />
      <script
        id="home-itemlist-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
      />
    </>
  )
}
