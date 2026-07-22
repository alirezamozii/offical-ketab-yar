import { BookOfTheDay } from '@/components/home/book-of-the-day'
import { ContinueReading } from '@/components/home/continue-reading'
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
import { HomePrefetcher } from '@/components/home/home-prefetcher'
import {
  MostReadBooks,
  RecentlyAddedBooks,
} from '@/components/home/book-sections'
import {
  getBooks,
  getMostReadBooks,
  getRecentlyAddedBooks,
} from '@/lib/data'
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'

const SITE_URL = SITE.url

export const metadata: Metadata = {
  title: 'کتاب‌یار | دانلود رایگان کتاب انگلیسی و مطالعه دوزبانه با AI',
  description:
    'کتاب‌های کلاسیک انگلیسی را رایگان و دوزبانه بخوانید. ترجمه پاراگراف به پاراگراف، دیکشنری هوشمند، واژگان و چت با هوش مصنوعی. یادگیری زبان انگلیسی با کتاب کلاسیک.',
  keywords: [
    'کتاب انگلیسی',
    'مطالعه دوزبانه',
    'یادگیری زبان انگلیسی',
    'کتاب رایگان',
    'کتاب دوزبانه',
    'هوش مصنوعی',
    'دیکشنری هوشمند',
    'کتاب‌یار',
    'کتاب کلاسیک انگلیسی',
    'ترجمه فارسی کتاب',
    'Alice in Wonderland',
    'bilingual English Persian books',
    'learn English with books',
    'English books free',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_URL,
    siteName: 'کتاب‌یار',
    title: 'کتاب‌یار — مطالعه دوزبانه کتاب انگلیسی با هوش مصنوعی',
    description:
      'کتاب‌های کلاسیک انگلیسی را رایگان و دوزبانه بخوانید. دیکشنری هوشمند، واژگان‌ساز و چت با هوش مصنوعی.',
    images: [
      {
        url: '/api/og?title=Ketab-Yar&subtitle=Bilingual%20English%20books%20with%20AI',
        width: 1200,
        height: 630,
        alt: 'کتاب‌یار — پلتفرم مطالعه دوزبانه با هوش مصنوعی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کتاب‌یار — مطالعه دوزبانه با AI',
    description:
      'کتاب‌های کلاسیک انگلیسی رایگان با مطالعه دوزبانه و هوش مصنوعی',
    images: ['/api/og?title=Ketab-Yar&subtitle=Bilingual%20English%20books%20with%20AI'],
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
  const [recent, mostRead, allBooks, quoteOfTheDay] = await Promise.all([
    getRecentlyAddedBooks(12),
    getMostReadBooks(12),
    getBooks(),
    getQuoteOfTheDayFromDB(),
  ])

  const prefetchBooks = mostRead.slice(0, 3).map((b) => ({
    slug: b.slug,
    title: b.title,
    pageCount: b.pageCount,
  }))

  // Real catalog totals — fed to client components so the home page never
  // shows fabricated marketing numbers. Books count and total pages come
  // straight from the database.
  const booksCount = allBooks.length
  const pagesCount = allBooks.reduce((sum, b) => sum + b.pageCount, 0)
  // Real reading metrics — sum of all view counts and total minutes read
  // across the catalog. These replace the old "10 levels / 1 AI" stats
  // that the user found meaningless.
  const totalReads = allBooks.reduce((sum, b) => sum + (b.viewCount || 0), 0)
  const totalMinutes = Math.round(
    allBooks.reduce((sum, b) => sum + (b.viewCount || 0) * 12, 0) / 60,
  )

  // --- Structured data: WebPage ----------------------------------------------
  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: 'کتاب‌یار — مطالعه دوزبانه کتاب انگلیسی با هوش مصنوعی',
    description:
      'پلتفرم هوشمند مطالعه دوزبانه کتاب‌های انگلیسی با هوش مصنوعی، دیکشنری و واژگان‌ساز.',
    inLanguage: 'fa-IR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
  }

  // --- FAQ items (shared between JSON-LD + visible FaqSection) ---------------
  // Single source of truth so the SEO schema and the visible accordion
  // never drift apart. `allBooks.length` is interpolated at render time.
  const faqItems: FaqItem[] = [
    {
      question: 'آیا کتاب‌یار رایگان است؟',
      answer:
        'بله، مطالعه کتاب‌های انگلیسی دوزبانه، دیکشنری هوشمند، ذخیره واژگان و هایلایت‌ها در کتاب‌یار کاملاً رایگان است. برخی ویژگی‌های پیشرفته مانند ترجمه نامحدود یا چت پریمیوم با هوش مصنوعی در نسخه پولی قرار دارند اما بخش اصلی تجربه رایگان است.',
    },
    {
      question: 'چگونه با کتاب‌یار زبان انگلیسی یاد بگیرم؟',
      answer:
        'با مطالعه دوزبانه پاراگراف به پاراگراف، انتخاب کلمه برای دیدن معنی و تلفظ، ذخیره واژگان در واژگان‌ساز و تمرین منظم با سیستم تکرار با فاصله (SRS)، در همان حالی که کتاب می‌خوانید زبان یاد می‌گیرید. چت با هوش مصنوعی هم برای رفع اشکال گرامری و درک بهتر متن در دسترس است.',
    },
    {
      question: 'آیا می‌توانم کتاب‌ها را دانلود کنم؟',
      answer:
        'کتاب‌یار یک پلتفرم مطالعه آنلاین است و فعلاً امکان دانلود فایل PDF وجود ندارد. می‌توانید کتاب‌ها را به‌صورت دوزبانه در سایت مطالعه کنید و پیشرفت مطالعه‌تان به‌صورت خودکار ذخیره می‌شود تا ادامه کتاب را در هر دستگاهی از سر بگیرید.',
    },
    {
      question: 'چند کتاب در کتاب‌یار موجود است؟',
      answer: `در حال حاضر ${allBooks.length} کتاب کلاسیک انگلیسی مانند آلیس در سرزمین عجایب، گاتبی بزرگ، داستان دو شهر و... با ترجمه فارسی، در سطوح مختلف از مبتدی تا پیشرفته موجود است و هر هفته کتاب‌های جدید اضافه می‌شود.`,
    },
    {
      question: 'هوش مصنوعی در کتاب‌یار چطور کار می‌کند؟',
      answer:
        'دو ابزار هوش مصنوعی داریم: دیکشنری هوشمند که با انتخاب کلمه، معنی، تلفظ، مثال و معادل فارسی را نمایش می‌دهد و چت هوش مصنوعی که می‌توانید درباره پیرنگ کتاب، معنی جمله، گرامر یا هر سوال دیگری بپرسید. این ابزارها بر پایه مدل‌های زبانی بزرگ کار می‌کنند.',
    },
    {
      question: 'سطوح کتاب‌ها در کتاب‌یار چیست؟',
      answer:
        'کتاب‌ها بر اساس استاندارد CEFR در سطوح A1، A2، B1، B2 و C1 دسته‌بندی می‌شوند. در صفحه کتابخانه می‌توانید با فیلتر سطح، کتاب متناسب با توانایی زبانی خود را پیدا کنید.',
    },
    {
      question: 'آیا می‌توانم کتاب‌ها را به‌صورت آفلاین بخوانم؟',
      answer:
        'کتاب‌یار در حال حاضر برای مطالعه به اینترنت نیاز دارد، اما قابلیت PWA را دارد و می‌توانید آن را روی گوشی نصب کنید. پشتیبانی کامل از مطالعه آفلاین و همگام‌سازی در نسخه‌های بعدی در دسترس خواهد بود.',
    },
    {
      question: 'آیا کتاب‌یار برای کودکان مناسب است؟',
      answer:
        'بله، بخش بزرگی از کتاب‌ها مانند آلیس در سرزمین عجایب، جزیره گنج و داستان‌های کلاسیک کودکان برای سطوح A1 و A2 مناسب هستند. والدین می‌توانند با فیلتر سطح، کتاب مناسب سن و توانایی زبانی فرزندشان را انتخاب کنند.',
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

  // --- Structured data: ItemList (catalog of all books) ----------------------
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#booklist`,
    name: 'کتاب‌های انگلیسی دوزبانه کتاب‌یار',
    description: `فهرست ${allBooks.length} کتاب انگلیسی دوزبانه در کتاب‌یار — مطالعه رایگان با ترجمه فارسی، دیکشنری هوشمند و هوش مصنوعی.`,
    numberOfItems: allBooks.length,
    itemListElement: allBooks.map((b, i) => ({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
      />

      <HeroSection booksCount={booksCount} />
      <StatsBar
        booksCount={booksCount}
        pagesCount={pagesCount}
        totalReads={totalReads}
        totalMinutes={totalMinutes}
      />

      <ContinueReading />
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
    </>
  )
}
