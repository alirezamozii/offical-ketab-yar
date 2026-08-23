import { ProfessionalReader } from '@/components/reader/professional-reader'
import { getReaderBook, incrementViewCount } from '@/lib/data'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getReaderBook(slug)
  if (!book) return { title: 'کتاب یافت نشد' }
  const canonical = `${SITE.url}/books/read/${slug}`
  const title = `مطالعه دوزبانه ${book.title} اثر ${book.author}`
  const description = `متن کامل انگلیسی و ترجمه فارسی کتاب ${book.title} اثر ${book.author}. مطالعه دوزبانه همراه با سیستم هوشمند تلفظ صوتی و دیکشنری.`
  return {
    title,
    description,
    keywords: [book.title, book.author, 'مطالعه دوزبانه', 'کتاب انگلیسی با ترجمه'],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function ReaderRoute({ params }: PageProps) {
  const { slug } = await params
  const book = await getReaderBook(slug)
  if (!book) notFound()

  incrementViewCount(slug)

  return (
    <>
      <h1 className="sr-only">خواندن کتاب {book.title} اثر {book.author}</h1>
      <ProfessionalReader book={book} />
    </>
  )
}
