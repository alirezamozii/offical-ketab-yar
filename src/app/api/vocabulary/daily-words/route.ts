import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'

/**
 * GET /api/vocabulary/daily-words
 *
 * Returns 5 "کلمات روزانه" — English words extracted from the reader's
 * in-progress books first (ReadingProgress), then the rest of the catalog.
 * Returns [] when the catalog is empty — no hardcoded fallback words. The selection is deterministic for a given (guest, day) so the
 * same 5 words are shown all day, rotating at midnight local time.
 *
 * Each item has: { word, context, bookSlug, bookTitle, bookAuthor } — no
 * translation (the client fetches that on demand via /api/dictionary when
 * the user clicks "یاد بگیر").
 */

const WORDS_PER_DAY = 5
const MIN_WORD_LEN = 4
const MAX_WORD_LEN = 12

// A small stopword list so we don't suggest "the", "and", "of"…
const STOPWORDS = new Set([
  'the', 'and', 'but', 'for', 'with', 'from', 'that', 'this', 'have', 'has',
  'had', 'were', 'was', 'will', 'would', 'could', 'should', 'they', 'them',
  'their', 'there', 'where', 'when', 'what', 'which', 'who', 'whom', 'whose',
  'into', 'onto', 'upon', 'over', 'under', 'about', 'after', 'before',
  'between', 'among', 'through', 'during', 'while', 'because', 'although',
  'though', 'until', 'since', 'than', 'then', 'some', 'any', 'all', 'both',
  'each', 'every', 'other', 'such', 'same', 'only', 'very', 'more', 'most',
  'less', 'least', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'first', 'second', 'third', 'last', 'next',
  'here', 'now', 'just', 'also', 'very', 'too', 'quite', 'even', 'still',
  'said', 'says', 'say', 'saying', 'went', 'come', 'came', 'comes', 'coming',
  'made', 'make', 'makes', 'making', 'take', 'took', 'taken', 'takes', 'taking',
  'get', 'got', 'gets', 'getting', 'give', 'gave', 'given', 'gives', 'giving',
  'goes', 'going', 'gone', 'look', 'looked', 'looks', 'looking',
  'know', 'knew', 'known', 'knows', 'knowing', 'think', 'thought', 'thinks',
  'thinking', 'see', 'saw', 'seen', 'sees', 'seeing', 'find', 'found', 'finds',
  'finding', 'told', 'tell', 'tells', 'telling', 'asked', 'ask', 'asks',
  'asking', 'put', 'puts', 'putting', 'let', 'lets', 'letting',
])

/** Deterministic PRNG seeded from a string (date + guestId). */
function seededRandom(seed: string): () => number {
  // FNV-1a hash → 32-bit integer
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  return () => {
    // mulberry32
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface DailyWord {
  word: string
  context: string
  bookSlug: string
  bookTitle: string
  bookAuthor: string
}

export async function GET(req: NextRequest) {
  try {
    const { id: guestId } = await getOrCreateGuestId()
    const url = new URL(req.url)
    const requestedDate = url.searchParams.get('date')
    const day = requestedDate || todayKey()

    // Seeded RNG so the same (day, guestId) returns the same word set.
    const rng = seededRandom(`${day}:${guestId}`)

    // Personalized source: prefer pages from books the reader is actually
    // reading (ReadingProgress for this guest), then top up from the rest of
    // the published catalog so there are always enough candidates.
    const progress = await db.readingProgress.findMany({
      where: { guestId },
      select: { bookSlug: true },
      orderBy: { lastReadAt: 'desc' },
      take: 20,
    })
    const mySlugs = Array.from(new Set(progress.map((p) => p.bookSlug)))

    const pageSelect = {
      english: true,
      book: { select: { slug: true, title: true, author: { select: { name: true } } } },
    } as const

    const pages = mySlugs.length
      ? await db.bookPage.findMany({
          take: 200,
          where: { type: 'text', book: { isPublished: true, slug: { in: mySlugs } } },
          orderBy: { id: 'asc' },
          select: pageSelect,
        })
      : []

    if (pages.length < 50) {
      const rest = await db.bookPage.findMany({
        take: 200,
        where: {
          type: 'text',
          book: { isPublished: true, ...(mySlugs.length ? { slug: { notIn: mySlugs } } : {}) },
        },
        orderBy: { id: 'asc' },
        select: pageSelect,
      })
      pages.push(...rest)
    }

    // No pages at all (empty catalog) → return an empty list
    if (pages.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    const pool = [...pages]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    const seen = new Set<string>()
    const out: DailyWord[] = []

    for (const page of pool) {
      if (out.length >= WORDS_PER_DAY) break
      if (!page.english) continue
      const tokens = page.english
        .replace(/['".,!?;:()[]{}—–-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim().toLowerCase())
        .filter(
          (t) =>
            t.length >= MIN_WORD_LEN &&
            t.length <= MAX_WORD_LEN &&
            /^[a-z]+$/.test(t) &&
            !STOPWORDS.has(t),
        )
      if (tokens.length === 0) continue
      // Prefer a shuffled token that is not a proper noun (must appear in
      // lowercase form in the page text) and has not been picked yet.
      let candidate: string | null = null
      for (let k = tokens.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1))
        ;[tokens[k], tokens[j]] = [tokens[j], tokens[k]]
      }
      for (const t of tokens) {
        if (seen.has(t)) continue
        if (!new RegExp(`\\b${t}\\b`).test(page.english)) continue // proper noun (only capitalized)
        candidate = t
        break
      }
      if (!candidate) continue
      seen.add(candidate)

      const sentences = page.english.split(/(?<=[.!?])\s+/)
      const ctx =
        sentences.find((s) =>
          new RegExp(`\\b${candidate}\\b`, 'i').test(s),
        )?.trim() ?? page.english.slice(0, 160)

      out.push({
        word: candidate,
        context: ctx.slice(0, 240),
        bookSlug: page.book.slug,
        bookTitle: page.book.title,
        bookAuthor: page.book.author?.name ?? '',
      })
    }

    if (out.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, max-age=60' },
      })
    }

    return NextResponse.json(out, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.warn('[/api/vocabulary/daily-words] DB offline or query error, returning fallback:', err)
    return NextResponse.json([], {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }
}

