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

        // ⚡ Bolt: Next.js App Router natively serializes plain objects.
        // Removed JSON.parse(JSON.stringify()) anti-pattern to avoid redundant CPU overhead.
        // Expected impact: Faster initial render time on the server.
        return (
            <BookCarouselSectionClient
                title="پرخواننده‌ترین کتاب‌ها"
                description="کتاب‌هایی که بیشترین تعداد خواننده را داشته‌اند"
                books={books}
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
