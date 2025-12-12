import { getBooks } from '@/lib/data'
import { transformBooksForDisplay } from '@/lib/sanity/transform'
import { BookCarouselSectionClient } from './book-carousel-section-client'

export async function RecentlyAddedBooks() {
    try {
        const sanityBooks = await getBooks()

        if (!sanityBooks || sanityBooks.length === 0) {
            return null
        }

        // Transform Sanity books with proper image URLs and Farsi text
        const transformedBooks = transformBooksForDisplay(sanityBooks)

        const books = transformedBooks.map(book => ({
            _id: book._id,
            slug: book.slug,
            title: book.displayTitle, // Farsi priority
            author: book.authorName,
            coverImage: book.coverImage, // Proper Sanity URL
            genres: book.genres, // Already transformed to Farsi
            level: book.level,
            isPremium: book.isPremium || false,
        }))

        // Serialize to ensure JSON-safe data for Client Component (Agent 2 - Performance)
        const serializedBooks = JSON.parse(JSON.stringify(books))

        return (
            <BookCarouselSectionClient
                title="جدیدترین کتاب‌ها"
                description="تازه‌ترین کتاب‌های اضافه شده به کتابخانه"
                books={serializedBooks}
                iconType="sparkles"
                viewAllLink="/library?sort=newest"
                viewAllText="مشاهده همه کتاب‌های جدید"
                autoScrollDirection="left"
            />
        )
    } catch (error) {
        console.error('Error loading recently added books:', error)
        return null
    }
}
