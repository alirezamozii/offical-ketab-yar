/**
 * Parses interleaved English-Farsi text into compact JSON structure
 * 
 * Input format:
 * Chapter 1: Title
 * فصل اول: عنوان
 * 
 * English paragraph.
 * پاراگراف فارسی.
 * 
 * Page: 2
 * 
 * Next paragraph.
 * پاراگراف بعدی.
 */

export function parseInterleavedText(text: string) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

    const chapters: any[] = [];
    let currentChapterContent: any[] = [];
    let currentChapterTitle = { e: 'Untitled Chapter', f: 'فصل بدون عنوان' };
    let chapterIndex = 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

        // Check if next line is Farsi (contains Persian characters)
        const nextLineIsFarsi = /[\u0600-\u06FF]/.test(nextLine);

        // Detect Chapter Heading
        const isChapterHeading =
            line.toLowerCase().startsWith('chapter') ||
            (line.length < 80 && nextLineIsFarsi && !line.toLowerCase().startsWith('page:'));

        if (isChapterHeading && nextLineIsFarsi) {
            // Save previous chapter if it has content
            if (currentChapterContent.length > 0) {
                chapters.push({
                    n: chapterIndex++,
                    t: currentChapterTitle,
                    p: groupContentByPage(currentChapterContent),
                });
            }

            // Start new chapter
            currentChapterContent = [];
            currentChapterTitle = { e: line, f: nextLine };
            i++; // Skip the Farsi title line
            continue;
        }

        // Detect Page Marker
        if (line.toLowerCase().startsWith('page:')) {
            const pageNum = parseInt(line.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(pageNum)) {
                currentChapterContent.push({ type: 'pageMarker', pg: pageNum });
            }
            continue;
        }

        // Detect Bilingual Paragraph
        const isEnglish = !/[\u0600-\u06FF]/.test(line);

        if (isEnglish && nextLineIsFarsi) {
            // Check if it's a heading (short line, likely bold in reader)
            const isHeading = line.length < 80 && !line.endsWith('.') && !line.endsWith('!') && !line.endsWith('?');

            currentChapterContent.push({
                type: isHeading ? 'heading' : 'paragraph',
                e: line,
                f: nextLine
            });
            i++; // Skip the Farsi line
        }
    }

    // Add the last chapter
    if (currentChapterContent.length > 0) {
        chapters.push({
            n: chapterIndex,
            t: currentChapterTitle,
            p: groupContentByPage(currentChapterContent),
        });
    }

    return { chapters };
}

// Helper to group paragraphs under page markers
function groupContentByPage(content: any[]) {
    const pages: any[] = [];
    let currentPage = 1;
    let itemsOnPage: any[] = [];

    content.forEach(item => {
        if (item.type === 'pageMarker') {
            // Save current page if it has items
            if (itemsOnPage.length > 0) {
                pages.push({ pg: currentPage, i: itemsOnPage });
            }
            currentPage = item.pg;
            itemsOnPage = [];
        } else {
            // Add item to current page
            if (item.type === 'heading') {
                itemsOnPage.push({ h: { e: item.e, f: item.f } });
            } else {
                itemsOnPage.push({ t: { e: item.e, f: item.f } });
            }
        }
    });

    // Add the last page's content
    if (itemsOnPage.length > 0) {
        pages.push({ pg: currentPage, i: itemsOnPage });
    }

    return pages;
}
