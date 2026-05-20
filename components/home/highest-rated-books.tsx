import { getTrendingBooks } from '@/lib/data'
import { transformBooksForDisplay } from '@/lib/sanity/transform'
import { BookCarouselSectionClient } from './book-carousel-section-client'

export async function HighestRatedBooks() {
  try {
    const sanityBooks = await getTrendingBooks(12)

    if (!sanityBooks || sanityBooks.length === 0) {
      return null
    }

    // Transform Sanity books with proper image URLs and Farsi text
    const books = transformBooksForDisplay(sanityBooks).map(book => ({
      ...book,
      title: book.displayTitle,
      author: book.authorName,
    }))

    // Removed unnecessary JSON.parse(JSON.stringify) as Next.js App Router
    // natively handles passing plain objects from Server to Client Components.
    // This avoids redundant CPU serialization overhead.

    return (
      <BookCarouselSectionClient
        title="بالاترین امتیازها"
        description="کتاب‌هایی که بیشترین امتیاز را از خوانندگان دریافت کرده‌اند"
        books={books}
        iconType="star"
        viewAllLink="/library?sort=rating"
        viewAllText="مشاهده همه کتاب‌های برتر"
        bgClass="bg-muted/30"
        autoScrollDirection="right"
      />
    )
  } catch (error) {
    console.error('Error loading highest rated books:', error)
    return null
  }
}
