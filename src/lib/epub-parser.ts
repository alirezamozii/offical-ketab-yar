import zlib from 'zlib'
import path from 'path'

export interface ZipEntry {
  path: string
  uncompressedSize: number
  getData: () => Buffer
  getText: () => string
}

export function parseZipBuffer(buffer: Buffer): Map<string, ZipEntry> {
  const entries = new Map<string, ZipEntry>()
  let offset = 0

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset)

    if (signature === 0x04034b50) {
      const compressionMethod = buffer.readUInt16LE(offset + 8)
      const compressedSize = buffer.readUInt32LE(offset + 18)
      const uncompressedSize = buffer.readUInt32LE(offset + 22)
      const fileNameLength = buffer.readUInt16LE(offset + 26)
      const extraFieldLength = buffer.readUInt16LE(offset + 28)

      const fileName = buffer.toString(
        'utf8',
        offset + 30,
        offset + 30 + fileNameLength,
      )
      const dataOffset = offset + 30 + fileNameLength + extraFieldLength
      const compressedData = buffer.subarray(
        dataOffset,
        dataOffset + compressedSize,
      )

      const entry: ZipEntry = {
        path: fileName,
        uncompressedSize,
        getData: () => {
          if (compressionMethod === 0) {
            return compressedData
          } else if (compressionMethod === 8) {
            return zlib.inflateRawSync(compressedData)
          }
          throw new Error(
            `Unsupported compression method: ${compressionMethod}`,
          )
        },
        getText: () => {
          return entry.getData().toString('utf8')
        },
      }

      entries.set(fileName, entry)
      entries.set(fileName.replace(/\\/g, '/'), entry)

      offset = dataOffset + compressedSize
    } else {
      offset++
    }
  }

  return entries
}

export interface ParsedEpubChapter {
  order: number
  title: string
  titleFa: string
  slug: string
  startPage: number
  endPage: number
  wordCount: number
  pageCount: number
}

export interface ParsedEpubPage {
  pageNumber: number
  chapterOrder: number
  english: string
  farsi: string
  wordCount: number
  paragraphCount: number
}

export interface ParsedEpubResult {
  title: string
  titleFa: string
  slug: string
  author: {
    name: string
    nameFa: string
    slug: string
  }
  totalWords: number
  totalPages: number
  chapters: ParsedEpubChapter[]
  pages: ParsedEpubPage[]
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Split HTML content either by explicit EPUB pagebreaks
 * or by natural narrative paragraph groups.
 */
function extractPagesFromChapterHtml(
  html: string,
  targetDensity = 220,
  forceDensity = false,
): string[] {
  // Check if explicit pagebreak markers exist across the chapter
  const pagebreakRegex = /<(?:p|span|div|a)\s+[^>]*(?:epub:type=["']pagebreak["']|class=["'][^"']*page(?:-)?break[^"']*|id=["'](?:page|pb|p)[-_]?[0-9]+["'])[^>]*>/gi
  const rawSections = html.split(pagebreakRegex)
  const cleanedSections = rawSections
    .map((s) => cleanHtmlText(s))
    .filter((s) => s.length > 0)

  // If chapter has genuine internal page markers (> 3 per chapter) and we aren't forcing density, use them directly
  if (!forceDensity && cleanedSections.length >= 4) {
    return cleanedSections
  }

  // Otherwise, use standard physical book page density (~220 words per page at paragraph boundaries)
  const fullText = cleanHtmlText(html)
  const paragraphs = fullText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => {
      if (/^—?\s*(?:CHAPTER|PART|BOOK)\s+(?:[A-Z0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*—?$/i.test(p)) return false;
      return true;
    })

  if (paragraphs.length === 0) return []

  const pages: string[] = []
  let currentParas: string[] = []
  let currentWords = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const words = para.split(/\s+/).filter(Boolean).length
    const nextWords = currentWords + words

    if (currentWords > 0 && nextWords >= targetDensity) {
      if (Math.abs(currentWords - targetDensity) <= Math.abs(nextWords - targetDensity)) {
        pages.push(currentParas.join('\n\n'))
        currentParas = [para]
        currentWords = words
      } else {
        currentParas.push(para)
        pages.push(currentParas.join('\n\n'))
        currentParas = []
        currentWords = 0
      }
    } else {
      currentParas.push(para)
      currentWords += words
    }
  }

  if (currentParas.length > 0) {
    pages.push(currentParas.join('\n\n'))
  }

  return pages
}

/**
 * Filter and extract actual story chapters from spine items,
 * recognizing explicit pagebreaks where available.
 */
export function parseEpubBuffer(buffer: Buffer, targetPageCount?: number): ParsedEpubResult {
  const entries = parseZipBuffer(buffer)

  const containerEntry =
    entries.get('META-INF/container.xml') ||
    entries.get('META-INF\\container.xml')
  let opfPath = 'OEBPS/content.opf'

  if (containerEntry) {
    const xml = containerEntry.getText()
    const match = xml.match(/full-path=["']([^"']+)["']/i)
    if (match && match[1]) {
      opfPath = match[1]
    }
  }

  const opfEntry =
    entries.get(opfPath) ||
    entries.get(opfPath.replace(/\\/g, '/')) ||
    Array.from(entries.values()).find((e) => e.path.endsWith('.opf'))

  if (!opfEntry) {
    throw new Error('Invalid EPUB: content.opf not found')
  }

  const opfDir = path.dirname(opfEntry.path).replace(/\\/g, '/')
  const opfContent = opfEntry.getText()

  // Extract Metadata: Title, Creator/Author
  const titleMatch = opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)
  const creatorMatch = opfContent.match(
    /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i,
  )

  const rawTitle = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
    : 'Untitled Book'
  const rawAuthor = creatorMatch
    ? creatorMatch[1].replace(/<[^>]+>/g, '').trim()
    : 'Unknown Author'

  // Extract Spine items in order
  const spineMatches = Array.from(
    opfContent.matchAll(/<itemref\s+idref=["']([^"']+)["']/gi),
  )
  const spineIds = spineMatches.map((m) => m[1])

  // Map manifest items (id -> href)
  const manifestMap = new Map<string, string>()
  const itemMatches = Array.from(
    opfContent.matchAll(
      /<item\s+[^>]*id=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi,
    ),
  )
  for (const m of itemMatches) {
    manifestMap.set(m[1], m[2])
  }
  const itemMatches2 = Array.from(
    opfContent.matchAll(
      /<item\s+[^>]*href=["']([^"']+)["'][^>]*id=["']([^"']+)["']/gi,
    ),
  )
  for (const m of itemMatches2) {
    manifestMap.set(m[2], m[1])
  }

  // Extract chapter spine hrefs
  let chapterHrefs: string[] = []
  for (const id of spineIds) {
    const href = manifestMap.get(id)
    if (
      href &&
      !href.toLowerCase().includes('cover') &&
      !href.toLowerCase().includes('copyright') &&
      !href.toLowerCase().includes('toc') &&
      !href.toLowerCase().includes('contents') &&
      !href.toLowerCase().includes('dedication') &&
      !href.toLowerCase().includes('also_by') &&
      !href.toLowerCase().includes('title') &&
      !href.toLowerCase().includes('experience')
    ) {
      chapterHrefs.push(href)
    }
  }

  const primaryBookHrefs = chapterHrefs.filter((h) => {
    if (h.startsWith('hp02_') || h.includes('preview') || h.includes('teaser')) {
      return false
    }
    return true
  })
  if (primaryBookHrefs.length > 0) {
    chapterHrefs = primaryBookHrefs
  }

  // Extract raw chapters data
  interface RawChapterData {
    href: string
    title: string
    paragraphs: string[]
    wordCounts: number[]
    totalWords: number
  }

  const rawChapters: RawChapterData[] = []
  let chapterIndexTracker = 1

  for (const href of chapterHrefs) {
    const fullEntryPath = opfDir ? `${opfDir}/${href}` : href
    const normalizedPath = fullEntryPath.replace(/\\/g, '/')
    const entry =
      entries.get(normalizedPath) ||
      entries.get(href) ||
      Array.from(entries.values()).find((e) => e.path.endsWith(href))

    if (!entry) continue

    const html = entry.getText()
    const fullText = cleanHtmlText(html)
    const paragraphs = fullText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .filter((p) => {
        if (/^—?\s*(?:CHAPTER|PART|BOOK)\s+(?:[A-Z0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*—?$/i.test(p)) return false
        return true
      })

    if (paragraphs.length === 0) continue

    const wordCounts = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length)
    const totalWords = wordCounts.reduce((a, b) => a + b, 0)

    const hMatch =
      html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) ||
      html.match(/<p class="chapter[^>]*>([\s\S]*?)<\/p>/i) ||
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

    let chapterTitle = hMatch
      ? hMatch[1].replace(/<[^>]+>/g, '').trim()
      : `Chapter ${chapterIndexTracker}`
    chapterTitle = chapterTitle.replace(/\s+/g, ' ')

    rawChapters.push({
      href,
      title: chapterTitle,
      paragraphs,
      wordCounts,
      totalWords,
    })
    chapterIndexTracker++
  }

  // Exact Pagination Solver
  const sliceWithDensity = (paras: string[], wCounts: number[], density: number): string[] => {
    if (paras.length === 0) return []
    const chPages: string[] = []
    let currentParas: string[] = []
    let currentWords = 0

    for (let i = 0; i < paras.length; i++) {
      const para = paras[i]
      const words = wCounts[i]
      const nextWords = currentWords + words

      if (currentWords > 0 && nextWords >= density) {
        if (Math.abs(currentWords - density) <= Math.abs(nextWords - density)) {
          chPages.push(currentParas.join('\n\n'))
          currentParas = [para]
          currentWords = words
        } else {
          currentParas.push(para)
          chPages.push(currentParas.join('\n\n'))
          currentParas = []
          currentWords = 0
        }
      } else {
        currentParas.push(para)
        currentWords += words
      }
    }

    if (currentParas.length > 0) {
      chPages.push(currentParas.join('\n\n'))
    }
    return chPages
  }

  let finalDensity = 220
  if (targetPageCount && targetPageCount > 0) {
    let low = 40
    let high = 1500
    let bestDiff = 999999

    for (let iter = 0; iter < 30; iter++) {
      const mid = (low + high) / 2
      let totalP = 0
      for (const ch of rawChapters) {
        totalP += sliceWithDensity(ch.paragraphs, ch.wordCounts, mid).length
      }

      if (Math.abs(totalP - targetPageCount) < bestDiff) {
        bestDiff = Math.abs(totalP - targetPageCount)
        finalDensity = mid
      }

      if (totalP === targetPageCount) {
        finalDensity = mid
        break
      } else if (totalP > targetPageCount) {
        low = mid
      } else {
        high = mid
      }
    }
  }

  // Slice chapters with optimal density
  interface ChapterSlice {
    order: number
    title: string
    pages: string[]
  }

  const chapterSlices: ChapterSlice[] = rawChapters.map((ch, idx) => ({
    order: idx + 1,
    title: ch.title,
    pages: sliceWithDensity(ch.paragraphs, ch.wordCounts, finalDensity),
  }))

  // Exact target fine-tuning if targetPageCount is specified
  if (targetPageCount && targetPageCount > 0) {
    const countTotal = () => chapterSlices.reduce((acc, c) => acc + c.pages.length, 0)

    // If we have more pages than target, merge smallest adjacent pages within same chapter
    while (countTotal() > targetPageCount) {
      let minLen = 999999
      let bestChIdx = -1
      let bestPageIdx = -1

      for (let c = 0; c < chapterSlices.length; c++) {
        const cPages = chapterSlices[c].pages
        if (cPages.length <= 1) continue
        for (let p = 0; p < cPages.length - 1; p++) {
          const combinedWords = (cPages[p] + ' ' + cPages[p + 1]).split(/\s+/).length
          if (combinedWords < minLen) {
            minLen = combinedWords
            bestChIdx = c
            bestPageIdx = p
          }
        }
      }

      if (bestChIdx >= 0 && bestPageIdx >= 0) {
        chapterSlices[bestChIdx].pages[bestPageIdx] += '\n\n' + chapterSlices[bestChIdx].pages[bestPageIdx + 1]
        chapterSlices[bestChIdx].pages.splice(bestPageIdx + 1, 1)
      } else {
        break
      }
    }

    // If we have fewer pages than target, split the largest page with multiple paragraphs
    while (countTotal() < targetPageCount) {
      let maxWords = 0
      let bestChIdx = -1
      let bestPageIdx = -1

      for (let c = 0; c < chapterSlices.length; c++) {
        const cPages = chapterSlices[c].pages
        for (let p = 0; p < cPages.length; p++) {
          const paras = cPages[p].split(/\n\n+/)
          if (paras.length >= 2) {
            const w = cPages[p].split(/\s+/).length
            if (w > maxWords) {
              maxWords = w
              bestChIdx = c
              bestPageIdx = p
            }
          }
        }
      }

      if (bestChIdx >= 0 && bestPageIdx >= 0) {
        const paras = chapterSlices[bestChIdx].pages[bestPageIdx].split(/\n\n+/)
        const mid = Math.ceil(paras.length / 2)
        const p1 = paras.slice(0, mid).join('\n\n')
        const p2 = paras.slice(mid).join('\n\n')
        chapterSlices[bestChIdx].pages.splice(bestPageIdx, 1, p1, p2)
      } else {
        break
      }
    }
  }

  // Construct final pages and chapters output
  const pages: ParsedEpubPage[] = []
  const chapters: ParsedEpubChapter[] = []
  let globalPageNum = 1
  let globalWordCount = 0

  chapterSlices.forEach((ch) => {
    const chapterStartPage = globalPageNum
    let currentChapterWords = 0

    ch.pages.forEach((pageContent) => {
      const pWords = pageContent.split(/\s+/).filter(Boolean).length
      const pParas = pageContent.split(/\n\n+/).filter(Boolean).length

      pages.push({
        pageNumber: globalPageNum,
        chapterOrder: ch.order,
        english: pageContent,
        farsi: '',
        wordCount: pWords,
        paragraphCount: pParas,
      })

      globalPageNum++
      currentChapterWords += pWords
      globalWordCount += pWords
    })

    const chapterEndPage = globalPageNum - 1

    chapters.push({
      order: ch.order,
      title: ch.title,
      titleFa: `فصل ${ch.order}: ${ch.title}`,
      slug: `chapter-${ch.order}-${slugify(ch.title)}`,
      startPage: chapterStartPage,
      endPage: chapterEndPage,
      wordCount: currentChapterWords,
      pageCount: chapterEndPage - chapterStartPage + 1,
    })
  })

  return {
    title: rawTitle,
    titleFa: rawTitle,
    slug: slugify(rawTitle),
    author: {
      name: rawAuthor,
      nameFa: rawAuthor,
      slug: slugify(rawAuthor),
    },
    totalWords: globalWordCount,
    totalPages: pages.length,
    chapters,
    pages,
  }
}
