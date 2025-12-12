/**
 * Utility functions for working with compact book format
 */

export interface CompactBook {
    b: {
        t: { e: string; f: string } // title
        a: string // author
        s?: { e: string; f: string } // summary
        y?: number // year
        i?: string // isbn
        p?: string // publisher
        g?: string[] // genres
        l?: string // level
        seo?: {
            t?: { e: string; f: string } // SEO title
            d?: { e: string; f: string } // SEO description
            k?: string[] // SEO keywords
        }
    }
    c: Array<{
        // chapters
        n: number // chapter number
        t: { e: string; f: string } // chapter title
        p: Array<{
            // pages
            pg: number // page number
            i: Array<
                // items
                | { h: { e: string; f: string } } // heading
                | { t: { e: string; f: string } } // text
            >
        }>
    }>
}

/**
 * Get book metadata in readable format
 */
export function getBookMetadata(book: CompactBook) {
    return {
        title: {
            en: book.b.t.e,
            fa: book.b.t.f,
        },
        author: book.b.a,
        summary: book.b.s
            ? {
                en: book.b.s.e,
                fa: book.b.s.f,
            }
            : undefined,
        publishYear: book.b.y,
        isbn: book.b.i,
        publisher: book.b.p,
        genres: book.b.g || [],
        level: book.b.l,
        seo: book.b.seo
            ? {
                title: book.b.seo.t
                    ? {
                        en: book.b.seo.t.e,
                        fa: book.b.seo.t.f,
                    }
                    : undefined,
                description: book.b.seo.d
                    ? {
                        en: book.b.seo.d.e,
                        fa: book.b.seo.d.f,
                    }
                    : undefined,
                keywords: book.b.seo.k || [],
            }
            : undefined,
    }
}

/**
 * Get total number of pages in the book
 */
export function getTotalPages(book: CompactBook): number {
    let maxPage = 0
    book.c.forEach((chapter) => {
        chapter.p.forEach((page) => {
            if (page.pg > maxPage) {
                maxPage = page.pg
            }
        })
    })
    return maxPage
}

/**
 * Get chapter by number
 */
export function getChapterByNumber(book: CompactBook, chapterNumber: number) {
    return book.c.find((ch) => ch.n === chapterNumber)
}

/**
 * Get page by page number (searches all chapters)
 */
export function getPageByNumber(book: CompactBook, pageNumber: number) {
    for (const chapter of book.c) {
        const page = chapter.p.find((p) => p.pg === pageNumber)
        if (page) {
            return { chapter, page }
        }
    }
    return null
}

/**
 * Get all text content from a page (for search, etc.)
 */
export function getPageText(
    page: CompactBook['c'][0]['p'][0],
    language: 'en' | 'fa'
): string {
    return page.i
        .map((item) => {
            if ('h' in item) return item.h[language === 'en' ? 'e' : 'f']
            if ('t' in item) return item.t[language === 'en' ? 'e' : 'f']
            return ''
        })
        .join('\n\n')
}

/**
 * Check if text is RTL (Persian/Arabic)
 */
export function isRTL(language: 'en' | 'fa'): boolean {
    return language === 'fa'
}

/**
 * Get font family for language
 */
export function getFontFamily(language: 'en' | 'fa'): string {
    return language === 'fa' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'
}
