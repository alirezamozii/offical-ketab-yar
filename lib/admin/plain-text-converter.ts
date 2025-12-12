/**
 * PLAIN TEXT TO COMPACT JSON CONVERTER
 * 
 * Converts the AI translator's interleaved plain text format
 * into Sanity's compact JSON format automatically.
 * 
 * Input Format (from AI):
 * ```
 * Chapter 1: The Beginning
 * فصل اول: آغاز
 * 
 * English paragraph.
 * پاراگراف فارسی.
 * 
 * Page: 2
 * 
 * Next paragraph.
 * پاراگراف بعدی.
 * ```
 * 
 * Output: Compact JSON for Sanity
 */

export interface PlainTextBook {
    title: string
    titleFa: string
    author: string
    summary: string
    summaryFa: string
    year: number
    genres: string[]
    level: 'beginner' | 'intermediate' | 'advanced'
    content: string // The interleaved plain text
}

export interface CompactJSON {
    b: {
        t: { e: string; f: string }
        a: string
        s: { e: string; f: string }
        y: number
        g: string[]
        l: string
        seo?: {
            t: { e: string; f: string }
            d: { e: string; f: string }
            k: string[]
        }
    }
    c: Array<{
        n: number
        t: { e: string; f: string }
        p: Array<{
            pg: number
            i: Array<
                | { h: { e: string; f: string } }
                | { t: { e: string; f: string } }
            >
        }>
    }>
}

/**
 * Convert plain text interleaved format to compact JSON
 */
export function convertPlainTextToCompactJSON(
    book: PlainTextBook
): CompactJSON {
    const lines = book.content.split('\n')
    const chapters: CompactJSON['c'] = []

    let currentChapter: CompactJSON['c'][0] | null = null
    let currentPage: CompactJSON['c'][0]['p'][0] | null = null
    let currentPageNumber = 1
    let chapterNumber = 0

    let i = 0
    while (i < lines.length) {
        const line = lines[i].trim()

        // Skip empty lines
        if (!line) {
            i++
            continue
        }

        // Check for chapter heading
        if (line.startsWith('Chapter ')) {
            // Get English chapter title
            const englishTitle = line
            const farsiTitle = lines[i + 1]?.trim() || englishTitle

            chapterNumber++

            // Save previous chapter
            if (currentChapter && currentPage) {
                currentChapter.p.push(currentPage)
            }
            if (currentChapter) {
                chapters.push(currentChapter)
            }

            // Start new chapter
            currentChapter = {
                n: chapterNumber,
                t: {
                    e: englishTitle,
                    f: farsiTitle
                },
                p: []
            }

            // Start first page of chapter
            currentPage = {
                pg: currentPageNumber,
                i: []
            }

            i += 2 // Skip English and Farsi chapter titles
            continue
        }

        // Check for page marker
        if (line.startsWith('Page:')) {
            // Save current page
            if (currentPage && currentPage.i.length > 0) {
                currentChapter?.p.push(currentPage)
            }

            // Extract page number
            const pageMatch = line.match(/Page:\s*(\d+)/)
            currentPageNumber = pageMatch ? parseInt(pageMatch[1]) : currentPageNumber + 1

            // Start new page
            currentPage = {
                pg: currentPageNumber,
                i: []
            }

            i++
            continue
        }

        // Regular paragraph pair (English + Farsi)
        const englishText = line
        const farsiText = lines[i + 1]?.trim() || englishText

        if (!englishText) {
            i++
            continue
        }

        // Determine if it's a heading (short line, < 80 chars, no punctuation at end)
        const isHeading =
            englishText.length < 80 &&
            !englishText.endsWith('.') &&
            !englishText.endsWith('!') &&
            !englishText.endsWith('?') &&
            !englishText.endsWith('"') &&
            !englishText.includes('. ')

        if (isHeading) {
            currentPage?.i.push({
                h: {
                    e: englishText,
                    f: farsiText
                }
            })
        } else {
            currentPage?.i.push({
                t: {
                    e: englishText,
                    f: farsiText
                }
            })
        }

        i += 2 // Skip English and Farsi lines
    }

    // Save last page and chapter
    if (currentPage && currentPage.i.length > 0) {
        currentChapter?.p.push(currentPage)
    }
    if (currentChapter) {
        chapters.push(currentChapter)
    }

    // Generate SEO data
    const seoTitle = {
        e: `${book.title} by ${book.author} | Read Free Bilingual Book | Ketab-Yar`,
        f: `${book.titleFa} اثر ${book.author} | خواندن رایگان کتاب دوزبانه | کتاب‌یار`
    }

    const seoDescription = {
        e: `Read ${book.title} by ${book.author} in bilingual format (English/Persian). ${book.summary.substring(0, 100)}... Start reading free!`,
        f: `${book.titleFa} نوشته ${book.author} را به صورت دوزبانه بخوانید. ${book.summaryFa.substring(0, 100)}... شروع خواندن رایگان!`
    }

    const seoKeywords = [
        book.title,
        book.titleFa,
        book.author,
        'bilingual book',
        'کتاب دوزبانه',
        ...book.genres
    ]

    return {
        b: {
            t: {
                e: book.title,
                f: book.titleFa
            },
            a: book.author,
            s: {
                e: book.summary,
                f: book.summaryFa
            },
            y: book.year,
            g: book.genres,
            l: book.level,
            seo: {
                t: seoTitle,
                d: seoDescription,
                k: seoKeywords
            }
        },
        c: chapters
    }
}

/**
 * Convert compact JSON back to plain text (for editing)
 */
export function convertCompactJSONToPlainText(json: CompactJSON): string {
    let plainText = ''

    json.c.forEach((chapter) => {
        // Add chapter heading
        plainText += `${chapter.t.e}\n`
        plainText += `${chapter.t.f}\n\n`

        chapter.p.forEach((page, pageIndex) => {
            // Add page marker (except for first page of chapter)
            if (pageIndex > 0) {
                plainText += `Page: ${page.pg}\n\n`
            }

            page.i.forEach((item) => {
                if ('h' in item) {
                    // Heading
                    plainText += `${item.h.e}\n`
                    plainText += `${item.h.f}\n\n`
                } else if ('t' in item) {
                    // Text
                    plainText += `${item.t.e}\n`
                    plainText += `${item.t.f}\n\n`
                }
            })
        })
    })

    return plainText.trim()
}

/**
 * Validate plain text format
 */
export function validatePlainText(content: string): {
    valid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []
    const lines = content.split('\n')

    // Check for at least one chapter
    const hasChapter = lines.some(line => line.trim().startsWith('Chapter '))
    if (!hasChapter) {
        errors.push('No chapter found. Content must start with "Chapter X: Title"')
    }

    // Check for paragraph pairs
    let englishCount = 0
    let farsiCount = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        if (line.startsWith('Chapter ') || line.startsWith('Page:')) {
            continue
        }

        // Check if line contains Persian characters
        const hasPersian = /[\u0600-\u06FF]/.test(line)

        if (hasPersian) {
            farsiCount++
        } else {
            englishCount++
        }
    }

    if (Math.abs(englishCount - farsiCount) > 5) {
        warnings.push(
            `Unbalanced content: ${englishCount} English lines vs ${farsiCount} Farsi lines. ` +
            `Make sure each English paragraph has a Farsi translation.`
        )
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}
