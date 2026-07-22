import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { cache, TTL } from '@/lib/cache'

interface Segment {
  text: string
  match: boolean
}

type SearchHitType = 'book' | 'page' | 'author'

interface SearchHit {
  bookSlug: string
  bookTitle: string
  bookAuthor: string
  coverFrom: string
  coverTo: string
  coverAccent: string
  pageNumber: number
  snippetEn: string
  snippetFa: string
  /** Pre-split highlight segments — the client renders these directly. */
  segments: Segment[]
  matchType: 'english' | 'farsi'
  /** Relevance score (exact > word > starts-with > contains). */
  score: number
  /**
   * The matching text snippet with the query wrapped in `<mark>` tags so
   * callers that don't want to walk `segments` can render highlighted text
   * via `dangerouslySetInnerHTML` (or strip the tags for plain text).
   */
  highlight: string
  /** Result type — distinguishes page-text hits from book/author metadata hits. */
  type: SearchHitType
}

interface SearchResponse {
  hits: SearchHit[]
  /** True total number of hits (across all pages — before offset/limit). */
  total: number
  /** Number of distinct books that produced at least one hit. */
  bookCount: number
  /** Search execution time in milliseconds (Persian-digit formatted client-side). */
  took: number
  /** Whether the fuzzy fallback was used (true = no exact matches, so we split
   *  the query into words and matched any). */
  fuzzy: boolean
  /** Current page offset (echoed back for the client). */
  offset: number
  /** Page size (echoed back for the client). */
  limit: number
}

type Lang = 'all' | 'en' | 'fa'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 30
const SNIPPET_LEN = 140

/** Tight projection on the joined `book` — covers gradient triplet + slug/title/author + filterable fields. */
const BOOK_SELECT = {
  slug: true,
  title: true,
  author: { select: { name: true, nameFa: true, slug: true } },
  description: true,
  coverFrom: true,
  coverTo: true,
  coverAccent: true,
  coverImage: true,
  coverImageUrl: true,
  coverBlurhash: true,
  genres: true,
  level: true,
  rating: true,
} satisfies Prisma.BookSelect

/** Search results are dynamic (depend on what the user just typed) → never cache at the CDN layer. */
const SEARCH_CACHE_CONTROL = 'no-store'

/** Parse a comma-separated list from a query param. Empty → []. */
function parseList(v: string | null): string[] {
  if (!v) return []
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Strict genre-membership check (genres stored as a JSON string array). */
function hasGenre(bookGenres: string, target: string): boolean {
  try {
    const v = JSON.parse(bookGenres)
    return Array.isArray(v) && v.map(String).includes(target)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const startedAt =
    typeof performance !== 'undefined' ? performance.now() : Date.now()

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const langParam = (url.searchParams.get('lang') ?? 'all') as Lang
  const lang: Lang = langParam === 'en' || langParam === 'fa' ? langParam : 'all'

  // ─── pagination ───────────────────────────────────────────────────────
  const offsetRaw = Math.max(0, Number(url.searchParams.get('offset')) || 0)
  const limitRaw = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT
  const offset = offsetRaw
  const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT)

  // ─── filters ──────────────────────────────────────────────────────────
  const genres = parseList(url.searchParams.get('genre'))
  const levels = parseList(url.searchParams.get('level'))
  const minRating = Math.max(0, Math.min(5, Number(url.searchParams.get('minRating')) || 0))
  const typeFilter = url.searchParams.get('type') as SearchHitType | null

  // Empty / too-short query → return an empty result set (NOT a 400 error).
  // The search UI uses this to clear the results list without showing an
  // error toast — typing one character shouldn't be treated as user error.
  if (!q || q.length < 2) {
    return NextResponse.json(
      {
        hits: [],
        total: 0,
        bookCount: 0,
        took: 0,
        fuzzy: false,
        offset,
        limit,
      } satisfies SearchResponse,
      { headers: { 'Cache-Control': SEARCH_CACHE_CONTROL } },
    )
  }

  const normalized = q.toLowerCase()
  // Include pagination + filter dimensions in the cache key so different
  // page/filter combos don't collide.
  const cacheKey = [
    'search',
    lang,
    normalized,
    `o${offset}`,
    `l${limit}`,
    genres.length ? `g${genres.join('|')}` : '',
    levels.length ? `lv${levels.join('|')}` : '',
    minRating ? `r${minRating}` : '',
    typeFilter ?? '',
  ].join(':')

  try {
    const payload = await cache.wrap(cacheKey, async () => {
      // ─── 1. Exact-contains query against BookPage ──────────────────────
      // Build the where-clause based on the language filter.
      // `all` matches either field; `en`/`fa` matches only that field.
      const pageWhere: Prisma.BookPageWhereInput = {}
      if (lang === 'en') {
        pageWhere.english = { contains: q }
      } else if (lang === 'fa') {
        pageWhere.farsi = { contains: q }
      } else {
        pageWhere.OR = [
          { english: { contains: q } },
          { farsi: { contains: q } },
        ]
      }

      // Apply book-level filters via the `book` relation.
      const bookFilter: Prisma.BookWhereInput = {}
      if (levels.length) bookFilter.level = { in: levels }
      if (minRating > 0) bookFilter.rating = { gte: minRating }
      if (genres.length) {
        // Loose pre-filter at the SQL layer (string contains); strict
        // in-memory check below narrows to true genre membership.
        bookFilter.OR = genres.map((g) => ({ genres: { contains: g } }))
      }
      if (Object.keys(bookFilter).length) {
        pageWhere.book = bookFilter
      }

      let pages = await db.bookPage.findMany({
        where: pageWhere,
        include: { book: { select: BOOK_SELECT } },
        take: 200, // fetch a generous pool, then score + slice to `limit`
      })

      // ─── 2. Strict in-memory genre filter (handles JSON edge cases) ────
      if (genres.length) {
        pages = pages.filter((p) =>
          genres.some((g) => hasGenre(p.book.genres, g)),
        )
      }

      let fuzzyUsed = false

      // ─── 3. Fuzzy fallback ────────────────────────────────────────────
      // If no exact-contains matches, split the query into whitespace tokens
      // and match pages where ANY token appears in english/farsi. This catches
      // typos, multi-word queries with word-order differences, and partial
      // phrase matches.
      if (pages.length === 0) {
        const tokens = normalized.split(/\s+/).filter((t) => t.length >= 2)
        if (tokens.length > 1) {
          fuzzyUsed = true
          const fuzzyWhere: Prisma.BookPageWhereInput = {}
          const tokenClausesEn = tokens.map((t) => ({
            english: { contains: t },
          }))
          const tokenClausesFa = tokens.map((t) => ({
            farsi: { contains: t },
          }))
          if (lang === 'en') {
            fuzzyWhere.OR = tokenClausesEn
          } else if (lang === 'fa') {
            fuzzyWhere.OR = tokenClausesFa
          } else {
            fuzzyWhere.OR = [...tokenClausesEn, ...tokenClausesFa]
          }
          if (Object.keys(bookFilter).length) {
            fuzzyWhere.book = bookFilter
          }
          pages = await db.bookPage.findMany({
            where: fuzzyWhere,
            include: { book: { select: BOOK_SELECT } },
            take: 200,
          })
          if (genres.length) {
            pages = pages.filter((p) =>
              genres.some((g) => hasGenre(p.book.genres, g)),
            )
          }
        }
      }

      // ─── 4. Score + shape page hits ──────────────────────────────────
      const pageHits: SearchHit[] = pages.map((p) => {
        const enHit = lang !== 'fa' && p.english.toLowerCase().includes(normalized)
        const matchType: 'english' | 'farsi' = enHit ? 'english' : 'farsi'
        const source = matchType === 'english' ? p.english : p.farsi

        const authorName = p.book.author?.name ?? ''
        const pageScore = scoreRelevance(source, normalized)
        const bookBoost = bookMatchBoost(
          p.book.title,
          authorName,
          p.book.description,
          normalized,
        )
        const score = pageScore + bookBoost
        const snippet = makeSnippet(source, normalized, SNIPPET_LEN)
        const segments = highlightSegments(snippet, normalized)

        return {
          bookSlug: p.book.slug,
          bookTitle: p.book.title,
          bookAuthor: authorName,
          coverFrom: p.book.coverFrom,
          coverTo: p.book.coverTo,
          coverAccent: p.book.coverAccent,
          pageNumber: p.pageNumber,
          snippetEn: matchType === 'english' ? snippet : '',
          snippetFa: matchType === 'farsi' ? snippet : '',
          segments,
          matchType,
          score,
          highlight: renderHighlighted(segments),
          type: 'page' as const,
        }
      })

      // Dedup by (bookSlug, pageNumber, matchType).
      const seen = new Set<string>()
      const deduped = pageHits.filter((h) => {
        const key = `${h.bookSlug}-${h.pageNumber}-${h.matchType}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // ─── 5. Book-level metadata matches (title / author / description) ─
      // Books whose TITLE / AUTHOR / DESCRIPTION matches the query but whose
      // body text doesn't repeat the query.
      const slugsWithPageHits = new Set(deduped.map((h) => h.bookSlug))
      const bookOnlyWhere: Prisma.BookWhereInput = {
        slug: { notIn: [...slugsWithPageHits] },
        OR: [
          { title: { contains: q } },
          { author: { name: { contains: q } } },
          { author: { nameFa: { contains: q } } },
          { description: { contains: q } },
        ],
      }
      if (levels.length) bookOnlyWhere.level = { in: levels }
      if (minRating > 0) bookOnlyWhere.rating = { gte: minRating }
      if (genres.length) {
        bookOnlyWhere.AND = genres.map((g) => ({ genres: { contains: g } }))
      }

      let bookOnlyMatches = await db.book.findMany({
        where: bookOnlyWhere,
        select: BOOK_SELECT,
      })
      if (genres.length) {
        bookOnlyMatches = bookOnlyMatches.filter((b) =>
          genres.some((g) => hasGenre(b.genres, g)),
        )
      }

      const synthetic: SearchHit[] = bookOnlyMatches.map((b) => {
        const authorName = b.author?.name ?? ''
        const boost = bookMatchBoost(b.title, authorName, b.description, normalized)
        // Classify the metadata hit: author > title (an author hit means the
        // user is searching for a person, not a book; surfacing it under the
        // "authors" tab is more useful than under "books").
        const tLower = b.title.toLowerCase()
        const aLower = authorName.toLowerCase()
        const isAuthorHit = aLower.includes(normalized) && !tLower.includes(normalized)
        const source = b.description || b.title
        const snippet = makeSnippet(source, normalized, SNIPPET_LEN)
        return {
          bookSlug: b.slug,
          bookTitle: b.title,
          bookAuthor: authorName,
          coverFrom: b.coverFrom,
          coverTo: b.coverTo,
          coverAccent: b.coverAccent,
          pageNumber: 0,
          snippetEn: snippet,
          snippetFa: '',
          segments: highlightSegments(snippet, normalized),
          matchType: 'english',
          score: boost,
          highlight: renderHighlighted(highlightSegments(snippet, normalized)),
          type: (isAuthorHit ? 'author' : 'book') as SearchHitType,
        }
      })

      // ─── 6. Merge, sort, group, paginate ─────────────────────────────
      let all = [...deduped, ...synthetic]

      // Apply the type filter (book | page | author) if present.
      if (typeFilter) {
        all = all.filter((h) => h.type === typeFilter)
      }

      all.sort((a, b) => b.score - a.score || a.pageNumber - b.pageNumber)

      // Group by book preserving score order; within each book, hits are
      // already sorted by score.
      const grouped = new Map<string, SearchHit[]>()
      for (const h of all) {
        const arr = grouped.get(h.bookSlug) ?? []
        arr.push(h)
        grouped.set(h.bookSlug, arr)
      }

      // Re-flatten: book groups ordered by their best hit's score.
      const bookOrder = Array.from(grouped.entries()).sort(
        ([, a], [, b]) => (b[0]?.score ?? 0) - (a[0]?.score ?? 0),
      )

      const flat: SearchHit[] = []
      for (const [, bookHits] of bookOrder) {
        for (const h of bookHits) flat.push(h)
      }

      const total = flat.length
      const paged = flat.slice(offset, offset + limit)

      return {
        hits: paged,
        total,
        bookCount: bookOrder.length,
        took: Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
            startedAt,
        ),
        fuzzy: fuzzyUsed,
        offset,
        limit,
      } satisfies SearchResponse
    }, TTL.SEARCH)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': SEARCH_CACHE_CONTROL },
    })
  } catch (err) {
    console.error('[/api/search] GET failed:', err)
    return NextResponse.json(
      {
        hits: [],
        total: 0,
        bookCount: 0,
        took: Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
            startedAt,
        ),
        fuzzy: false,
        offset,
        limit,
        error: 'جست‌وجو ناموفق بود. لطفاً دوباره تلاش کنید.',
      } satisfies SearchResponse & { error: string },
      { status: 500, headers: { 'Cache-Control': SEARCH_CACHE_CONTROL } },
    )
  }
}

/**
 * Relevance score for a single field against the query.
 *
 * - Whole field equals query                     → 100
 * - A whitespace-tokenized word equals query     → 90
 * - Field starts with query                      → 70
 * - A word starts with query                     → 60
 * - Field contains query                         → 30
 * - fallback                                     → 10
 */
function scoreRelevance(field: string, qLower: string): number {
  const fLower = field.toLowerCase().trim()
  if (!fLower || !qLower) return 10
  if (fLower === qLower) return 100

  const words = fLower.split(/\s+/).filter(Boolean)
  if (words.includes(qLower)) return 90
  if (fLower.startsWith(qLower)) return 70
  if (words.some((w) => w.startsWith(qLower))) return 60
  if (fLower.includes(qLower)) return 30
  return 10
}

/**
 * Book-level relevance boost — applied to EVERY page hit in a book so the
 * book floats to the top of the result list when its metadata matches the
 * query. Boosts are deliberately larger than the 0–100 page-text score so a
 * single title match outranks any number of page-text matches in other books.
 *
 * Ranking priority:
 *   exact title match > title starts-with > title contains > author match > description match
 */
function bookMatchBoost(
  title: string,
  author: string,
  description: string,
  qLower: string,
): number {
  const tLower = title.toLowerCase().trim()
  const aLower = author.toLowerCase().trim()
  const dLower = description.toLowerCase().trim()

  if (!qLower) return 0

  if (tLower === qLower) return 10_000
  const titleWords = tLower.split(/\s+/).filter(Boolean)
  if (titleWords.includes(qLower)) return 8_000
  if (tLower.startsWith(qLower)) return 5_000
  if (titleWords.some((w) => w.startsWith(qLower))) return 4_000
  if (tLower.includes(qLower)) return 2_000

  if (aLower === qLower) return 1_500
  if (aLower.includes(qLower)) return 1_000

  if (dLower.includes(qLower)) return 500

  return 0
}

/** Build a snippet centered on the first match, with ellipsis on either side. */
function makeSnippet(text: string, qLower: string, len: number): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text.slice(0, len).trim()
  const start = Math.max(0, idx - Math.floor(len / 3))
  const end = Math.min(text.length, start + len)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + text.slice(start, end).trim() + suffix
}

/**
 * Split a snippet into matched / unmatched segments for the frontend to render
 * directly (no per-render re-splitting needed on the client).
 */
function highlightSegments(snippet: string, qLower: string): Segment[] {
  if (!qLower) return [{ text: snippet, match: false }]
  const lower = snippet.toLowerCase()
  const parts: Segment[] = []
  let lastIdx = 0
  let idx = lower.indexOf(qLower)
  while (idx !== -1) {
    if (idx > lastIdx) parts.push({ text: snippet.slice(lastIdx, idx), match: false })
    parts.push({ text: snippet.slice(idx, idx + qLower.length), match: true })
    lastIdx = idx + qLower.length
    idx = lower.indexOf(qLower, lastIdx)
  }
  if (lastIdx < snippet.length) parts.push({ text: snippet.slice(lastIdx), match: false })
  return parts.length ? parts : [{ text: snippet, match: false }]
}

/**
 * Render highlight segments into an HTML string with `<mark>` tags around
 * matched text. The tags are simple enough that we don't need a sanitizer —
 * the snippet content itself never contains HTML (it comes from plain-text
 * book pages). We do escape `<`, `>`, `&` in the snippet text first so a
 * stray `<` in a book page can't break out of the mark.
 */
function renderHighlighted(segments: Segment[]): string {
  return segments
    .map((s) => {
      const safe = escapeHtml(s.text)
      return s.match ? `<mark>${safe}</mark>` : safe
    })
    .join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
