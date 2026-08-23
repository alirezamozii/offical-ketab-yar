import { slugify } from './utils'

export function normalizePages(rawPages: any[]): any[] {
  const pages = (Array.isArray(rawPages) ? rawPages : []).map((p: any, idx: number) => ({
    pageNumber: Number(p.pageNumber) || idx + 1,
    english: p.english || p.en || p.eng || p.text || '',
    farsi: p.farsi || p.fa || p.persian || p.textFa || p.translation || '',
    type: p.type || 'text',
    meta: typeof p.meta === 'string' ? p.meta : JSON.stringify(p.meta || {}),
  }))
  return pages.sort((a: any, b: any) => a.pageNumber - b.pageNumber)
}

export function normalizeChapters(rawChapters: any[]): any[] {
  return (Array.isArray(rawChapters) ? rawChapters : []).map((c: any, idx: number) => ({
    title: c.title || `Chapter ${idx + 1}`,
    titleFa: c.titleFa || '',
    slug: c.slug || slugify(c.title || `chapter-${idx + 1}`),
    order: c.order !== undefined ? Number(c.order) : idx + 1,
    startPage: c.startPage !== undefined ? Number(c.startPage) : 1,
  }))
}

/**
 * Intelligently parse raw string that may contain:
 * - Markdown code blocks (```json ... ```)
 * - Multiple concatenated JSON blocks ({...} {...})
 * - Array of pages or single book object
 */
export function parseAnyJsonPayload(rawString: string): any {
  let cleaned = (rawString || '').trim()

  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '')
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '')
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '')
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned)
  } catch (initialErr) {
    // Check for concatenated JSON objects: { ... } { ... }
    const objectMatches = cleaned.match(/\{[\s\S]*?\}(?=\s*\{|\s*$)/g)
    if (objectMatches && objectMatches.length > 1) {
      let combinedBookSlug = ''
      let combinedTitle = ''
      let combinedTitleFa = ''
      const allChapters: any[] = []
      const allPages: any[] = []
      let lastAuthor: any = null
      let otherFields: Record<string, any> = {}

      for (const block of objectMatches) {
        try {
          const parsed = JSON.parse(block.trim())
          if (parsed.bookSlug) combinedBookSlug = parsed.bookSlug
          if (parsed.slug) combinedBookSlug = combinedBookSlug || parsed.slug
          if (parsed.title) combinedTitle = parsed.title
          if (parsed.titleFa) combinedTitleFa = parsed.titleFa
          if (parsed.author) lastAuthor = parsed.author
          if (Array.isArray(parsed.chapters)) allChapters.push(...parsed.chapters)
          if (Array.isArray(parsed.pages)) allPages.push(...parsed.pages)
          otherFields = { ...otherFields, ...parsed }
        } catch {
          // continue
        }
      }

      if (allPages.length > 0) {
        return {
          ...otherFields,
          bookSlug: combinedBookSlug || otherFields.bookSlug,
          title: combinedTitle || otherFields.title,
          titleFa: combinedTitleFa || otherFields.titleFa,
          author: lastAuthor || otherFields.author,
          chapters: allChapters.length > 0 ? allChapters : otherFields.chapters,
          pages: allPages,
        }
      }
    }
    throw initialErr
  }
}
