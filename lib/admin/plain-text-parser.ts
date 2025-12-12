/**
 * PLAIN TEXT TO COMPACT JSON PARSER
 * 
 * Converts the interleaved plain text format (from AI translator)
 * into Sanity's compact JSON format.
 * 
 * Input Format:
 * ```
 * Chapter 1: Title
 * فصل ۱: عنوان
 * 
 * English paragraph.
 * پاراگراف فارسی.
 * 
 * Page: 2
 * 
 * Next paragraph.
 * پاراگراف بعدی.
 * ```
 */

export interface ParsedBook {
    metadata: {
        titleEn: string
        titleFa: string
        author: string
        summaryEn: string
        summaryFa: string
        year: number
        genres: string[]
        level: string
    }
    chapters: Array<{
        number: number
        titleEn: string
        titleFa: string
        pages: Array<{
            pageNumber: number
            items: Array<{
                type: 'heading' | 'text'
                english: string
                farsi: string
            }>
        }>
    }>
}

export function parsePlainTextToCompactJSON(plainText: string, metadata: ParsedBook['metadata']): string {
    const lines = plainText.split('\n')
    const chapters: ParsedBook['chapters'] = []

    let currentChapter: ParsedBook['chapters'][0] | null = null
    let currentPage: ParsedBook['chapters'][0]['pages'][0] | null = null
    let currentPageNumber = 1
    let pendingEnglish: string | null = null
    let isHeading = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines
        if (!line) {
            continue
        }

        // Check for chapter heading
        if (line.startsWith('Chapter ')) {
            const chapterTitleEn = line.replace(/^Chapter \d+:\s*/, '')
            const chapterTitleFa = lines[i + 1]?.trim() || chapterTitleEn
            const chapterNumber = parseInt(line.match(/Chapter (\d+)/)?.[1] || '1')

            currentChapter = {
                number: chapterNumber,
                titleEn: chapterTitleEn,
                titleFa: chapterTitleFa,
                pages: []
            }

            chapters.push(currentChapter)

            // Create first page for this chapter
            currentPage = {
                pageNumber: currentPageNumber,
                items: []
            }
            currentChapter.pages.push(currentPage)

            i++ // Skip the Farsi title line
            continue
        }

        // Check for page marker
        if (line.startsWith('Page:')) {
            currentPageNumber = parseInt(line.replace('Page:', '').trim())

            if (currentChapter) {
                currentPage = {
                    pageNumber: currentPageNumber,
                    items: []
                }
                currentChapter.pages.push(currentPage)
            }
            continue
        }

        // Check if this is a heading (short line < 80 chars, not a page marker)
        const nextLine = lines[i + 1]?.trim()
        if (line.length < 80 && nextLine && !nextLine.startsWith('Page:') && !nextLine.startsWith('Chapter ')) {
            // This might be a heading
            isHeading = true
        }

        // Process English/Farsi pairs
        if (!pendingEnglish) {
            // This is an English line
            pendingEnglish = line
        } else {
            // This is the Farsi translation
            const farsi = line

            if (currentPage) {
                currentPage.items.push({
                    type: isHeading ? 'heading' : 'text',
                    english: pendingEnglish,
                    farsi: farsi
                })
            }

            pendingEnglish = null
            isHeading = false
        }
    }

    // Convert to compact JSON format
    const compactJSON = {
        b: {
            t: {
                e: metadata.titleEn,
                f: metadata.titleFa || metadata.titleEn
            },
            a: metadata.author,
            s: {
                e: metadata.summaryEn,
                f: metadata.summaryFa || metadata.summaryEn
            },
            y: metadata.year,
            g: metadata.genres,
            l: metadata.level,
            seo: {
                t: {
                    e: `${metadata.titleEn} by ${metadata.author} | Read Free Bilingual Book | Ketab-Yar`,
                    f: `${metadata.titleFa || metadata.titleEn} اثر ${metadata.author} | خواندن رایگان کتاب دوزبانه | کتاب‌یار`
                },
                d: {
                    e: metadata.summaryEn,
                    f: metadata.summaryFa || metadata.summaryEn
                },
                k: [metadata.titleEn, metadata.author, ...metadata.genres]
            }
        },
        c: chapters.map(chapter => ({
            n: chapter.number,
            t: {
                e: chapter.titleEn,
                f: chapter.titleFa
            },
            p: chapter.pages.map(page => ({
                pg: page.pageNumber,
                i: page.items.map(item => {
                    if (item.type === 'heading') {
                        return {
                            h: {
                                e: item.english,
                                f: item.farsi
                            }
                        }
                    } else {
                        return {
                            t: {
                                e: item.english,
                                f: item.farsi
                            }
                        }
                    }
                })
            }))
        }))
    }

    return JSON.stringify(compactJSON, null, 2)
}

/**
 * Convert compact JSON back to plain text (for editing)
 */
export function compactJSONToPlainText(compactJSON: string): string {
    try {
        const data = JSON.parse(compactJSON)
        let plainText = ''

        // Process chapters
        data.c.forEach((chapter: any, chapterIndex: number) => {
            // Add chapter heading
            plainText += `Chapter ${chapter.n}: ${chapter.t.e}\n`
            plainText += `${chapter.t.f}\n\n`

            // Process pages
            chapter.p.forEach((page: any, pageIndex: number) => {
                // Add page marker (except for first page of chapter)
                if (pageIndex > 0) {
                    plainText += `Page: ${page.pg}\n\n`
                }

                // Process items
                page.i.forEach((item: any) => {
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
    } catch (error) {
        console.error('Error converting compact JSON to plain text:', error)
        return ''
    }
}
