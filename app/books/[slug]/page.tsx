import { BookDetailClient } from '@/components/books/book-detail-client'
import { getAllBooks, getBookBySlug } from '@/lib/sanity/queries'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Agent 1 (SEO): This is our #1 SEO weapon - SSG for all book pages
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

interface BookPageProps {
  params: Promise<{ slug: string }>
}

// Generate static paths for all published books from Sanity
export async function generateStaticParams() {
  const books = await getAllBooks()

  if (!books || books.length === 0) return []

  return books.map((book) => ({
    slug: typeof book.slug === 'string' ? book.slug : book.slug.current,
  }))
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getBookBySlug(slug)

  if (!book) {
    return {
      title: 'کتاب یافت نشد | کتاب‌یار',
    }
  }

  const authorName = typeof book.author === 'string' ? book.author : book.author?.name || 'نویسنده ناشناس'
  const bookTitle = book.title
  const bookTitleFa = book.titleFa || bookTitle
  const coverImage = book.coverImage || '/placeholder-book.jpg'
  const bookSummary = book.summary || book.summaryFa || ''

  // Agent 1: Dynamic title with action words (Download, Read, Free)
  const title = book.seoTitle || `دانلود و مطالعه ${bookTitle} اثر ${authorName} | خلاصه و پیش‌نمایش رایگان | کتاب‌یار`

  // Agent 1: Dynamic description with keywords
  const description = book.seoDescription || `خلاصه کامل کتاب ${bookTitle} نوشته ${authorName}. این کتاب را به صورت رایگان و دوزبانه (فارسی/انگلیسی) در پلتفرم کتاب‌یار بخوانید و واژگان آن را یاد بگیرید.`

  return {
    title,
    description,
    keywords: [
      bookTitle,
      bookTitleFa,
      authorName,
      'دانلود رایگان کتاب',
      'خلاصه کتاب',
      'کتاب انگلیسی',
      'مطالعه دوزبانه',
      'یادگیری زبان',
      book.level || '',
    ].filter(Boolean),
    openGraph: {
      title: `${bookTitle} - ${authorName}`,
      description: bookSummary || description,
      images: coverImage ? [
        {
          url: coverImage,
          width: 600,
          height: 900,
          alt: `جلد کتاب ${bookTitle}`,
        }
      ] : [],
      type: 'book',
      locale: 'fa_IR',
      siteName: 'کتاب‌یار',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${bookTitle} - ${authorName}`,
      description: bookSummary || description,
      images: coverImage ? [coverImage] : [],
    },
    alternates: {
      canonical: `https://ketabyar.ir/books/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { slug } = await params

  // Fetch book from Sanity
  const book = await getBookBySlug(slug)

  if (!book) {
    notFound()
  }

  // Mock analytics for now (can be added to Sanity or kept in Supabase with client-side fetch)
  const analytics = {
    total_views: 0,
    average_rating: 0,
    total_ratings: 0
  }

  const authorName = typeof book.author === 'string' ? book.author : book.author?.name || 'Unknown Author'
  const bookTitle = book.title
  const coverImage = book.coverImage || '/placeholder-book.jpg'
  const bookSummary = book.summary || book.summaryFa || ''

  // Transform Sanity data to match BookDetailClient expected format
  const transformedBook = {
    ...book,
    id: book._id,
    cover_url: coverImage,
    description: bookSummary,
    is_premium: false, // All books free for now
    free_preview_pages: 20,
    language: 'english',
    total_pages: 0,
    slug: typeof book.slug === 'string' ? book.slug : book.slug.current,
  }

  // Agent 1: JSON-LD Structured Data for Rich Results
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: bookTitle,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    url: `https://ketabyar.ir/books/${slug}`,
    image: coverImage,
    description: bookSummary,
    inLanguage: 'en',
    ...(analytics?.average_rating && analytics.average_rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: analytics.average_rating.toFixed(1),
        reviewCount: analytics.total_ratings || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'IRR',
      category: 'Free Preview',
    },
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />

      {/* Client Component for Interactivity */}
      <BookDetailClient
        book={transformedBook}
        analytics={analytics}
      />
    </>
  )
}
