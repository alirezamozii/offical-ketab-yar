import { slugify } from '../../lib/utils'
import { generateBookPalette } from '../../lib/book-palette'
import {
  normalizePages,
  normalizeChapters,
  parseAnyJsonPayload,
} from '../../lib/json-payload-helpers'

export { normalizePages, normalizeChapters, parseAnyJsonPayload }

export function parseAuthorNameAndInput(rawData: any): { authorName: string; authorInput: any } {
  let authorName = ''
  let authorInput: any = null
  if (typeof rawData.author === 'string') {
    authorName = rawData.author.trim()
  } else if (rawData.author && typeof rawData.author === 'object') {
    authorInput = rawData.author
    authorName = rawData.author.name
  }
  if (!authorName) {
    throw new Error('نام نویسنده (author) نامعتبر یا خالی است.')
  }
  return { authorName, authorInput }
}

/**
 * Build the flat book data object from raw JSON + resolved IDs.
 */
export function buildBookData(
  rawData: any,
  bookSlug: string,
  authorId: string | number,
  normalizedPages: any[],
  normalizedChapters: any[],
) {
  const genres = Array.isArray(rawData.genres) ? rawData.genres : []
  const autoPalette = generateBookPalette(rawData.title || '', genres)

  return {
    title: rawData.title,
    slug: bookSlug,
    author: authorId,
    description: rawData.description || '',
    level: rawData.level || 'B1',
    genres,
    pageCount: normalizedPages.length,
    publishedYear: rawData.publishedYear ? Number(rawData.publishedYear) : 1900,
    coverFrom: rawData.coverFrom || autoPalette.coverFrom,
    coverTo: rawData.coverTo || autoPalette.coverTo,
    coverAccent: rawData.coverAccent || autoPalette.coverAccent,
    isPublished: rawData.isPublished !== false,
    isPremium: !!rawData.isPremium,
    allowDownload: rawData.allowDownload !== false,
    rating: rawData.rating ? Number(rawData.rating) : 0,
    reviewCount: rawData.reviewCount ? Number(rawData.reviewCount) : 0,
    viewCount: rawData.viewCount ? Number(rawData.viewCount) : 0,
    chapters: normalizedChapters,
    pages: normalizedPages,
  }
}


