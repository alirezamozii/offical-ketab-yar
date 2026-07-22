import { ProfessionalReader } from '@/components/reader/professional-reader'
import { getReaderBook, incrementViewCount } from '@/lib/data'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getReaderBook(slug)
  if (!book) return { title: 'کتاب یافت نشد' }
  return {
    title: `خواندن: ${book.title}`,
    description: `مطالعه دوزبانه ${book.title} اثر ${book.author} در کتاب‌یار`,
    robots: { index: false, follow: true },
  }
}

export default async function ReaderRoute({ params }: PageProps) {
  const { slug } = await params
  const book = await getReaderBook(slug)
  if (!book) notFound()

  incrementViewCount(slug)

  return <ProfessionalReader book={book} />
}
