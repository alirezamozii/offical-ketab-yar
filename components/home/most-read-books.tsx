import { getTrendingBooks } from '@/lib/data'
import { transformBooksForDisplay } from '@/lib/sanity/transform'
import { BookCarouselSectionClient } from './book-carousel-section-client'

export async function MostReadBooks() {
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

        // Serialize to ensure JSON-safe data for Client Component (Agent 2 - Performance)
        const serializedBooks = JSON.parse(JSON.stringify(books))

        return (
            <BookCarouselSectionClient
                title="پرخواننده‌ترین کتاب‌ها"
                description="کتاب‌هایی که بیشترین تعداد خواننده را داشته‌اند"
                books={serializedBooks}
                iconType="trending"
                viewAllLink="/library?sort=popular"
                viewAllText="مشاهده همه کتاب‌های محبوب"
                showReadCount
                autoScrollDirection="left"
            />
        )
    } catch (error) {
        console.error('Error loading most read books:', error)
        return null
    }
}
