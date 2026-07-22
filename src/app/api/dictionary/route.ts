import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiDictionary } from '@/lib/ai'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { db } from '@/lib/db'

/**
 * POST /api/dictionary
 *
 * Three-tier dictionary lookup:
 *   1. Local DB (DictionaryEntry) — instant Persian translation
 *   2. Free Dictionary API (dictionaryapi.dev) — English definitions, phonetics, audio
 *   3. Z-AI SDK (fallback) — AI-generated definition for words not in either source
 *
 * Tier 1 + 2 are free and cached. Tier 3 costs API quota but handles any word.
 *
 * Owner: Phase 5 R-DICT.2
 */

const DICT_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800'

const MAX_WORD_CHARS = 200
const MAX_CONTEXT_CHARS = 2_000

const DictionarySchema = z.object({
  word: z
    .string({ error: 'کلمه‌ای برای جست‌وجو وارد نشده است.' })
    .trim()
    .min(1, 'کلمه‌ای برای جست‌وجو وارد نشده است.')
    .max(MAX_WORD_CHARS, `کلمه نمی‌تواند بیشتر از ${MAX_WORD_CHARS} کاراکتر باشد.`),
  context: z
    .string()
    .trim()
    .max(MAX_CONTEXT_CHARS, `زمینه نمی‌تواند بیشتر از ${MAX_CONTEXT_CHARS} کاراکتر باشد.`)
    .optional()
    .or(z.literal('')),
})

// ── Tier 1: Local DB lookup ────────────────────────────────────────────────
async function lookupLocal(word: string) {
  const wordLower = word.toLowerCase().trim()
  const entry = await db.dictionaryEntry.findUnique({
    where: { wordLower },
    select: { word: true, persian: true, pos: true, phonetic: true },
  })
  return entry
}

// ── Tier 2: Free Dictionary API (dictionaryapi.dev) ────────────────────────
interface FreeDictMeaning {
  partOfSpeech: string
  definitions: Array<{ definition: string; example?: string }>
}
interface FreeDictPhonetic {
  text?: string
  audio?: string
}
interface FreeDictResponse {
  word: string
  phonetic?: string
  phonetics: FreeDictPhonetic[]
  meanings: FreeDictMeaning[]
  origin?: string
}

async function lookupFreeDictionaryApi(
  word: string,
): Promise<{
  meanings: Array<{ pos: string; definitionEn: string; example?: string }>
  phonetic: string
  audioUrl: string | null
} | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      },
    )
    if (!res.ok) return null
    const data: FreeDictResponse[] = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const meanings = (entry.meanings || []).map((m) => ({
      pos: m.partOfSpeech || '',
      definitionEn: m.definitions?.[0]?.definition || '',
      example: m.definitions?.[0]?.example,
    }))

    // Find best phonetic (prefer one with audio)
    const phonetic =
      entry.phonetic ||
      entry.phonetics?.find((p) => p.text)?.text ||
      ''
    const audioUrl =
      entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio || null

    return { meanings, phonetic, audioUrl }
  } catch {
    return null
  }
}

// ── Tier 2.5: Wiktionary REST API (etymology + deeper definitions) ─────────
interface WiktionaryDefinition {
  definition: string
  parsedExamples?: Array<{ example: string }>
}
interface WiktionaryLanguageEntry {
  partOfSpeech: string
  language: string
  definitions: WiktionaryDefinition[]
}
interface WiktionaryResponse {
  [language: string]: WiktionaryLanguageEntry[]
}

async function lookupWiktionary(
  word: string,
): Promise<{ etymology: string | null; extraMeanings: Array<{ pos: string; definitionEn: string; example?: string }> } | null> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/json' },
      },
    )
    if (!res.ok) return null
    const data: WiktionaryResponse = await res.json()
    if (!data || typeof data !== 'object') return null

    // Extract English definitions (data.en) — deeper than the free API
    const enEntries = data.en || []
    const extraMeanings = enEntries
      .flatMap((entry) =>
        (entry.definitions || []).map((def) => ({
          pos: entry.partOfSpeech || '',
          definitionEn: def.definition?.replace(/<[^>]+>/g, '').trim() || '',
          example: def.parsedExamples?.[0]?.example?.replace(/<[^>]+>/g, '').trim(),
        })),
      )
      .filter((m) => m.definitionEn.length > 0)
      .slice(0, 3)

    return { etymology: null, extraMeanings }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const blocked = await aiRateLimit(req, { anonLimit: 40, authLimit: 120, name: 'dictionary' })
  if (blocked) return blocked

  const parsed = await parseBody(req, DictionarySchema)
  if (!parsed.ok) return parsed.response

  const { word, context } = parsed.data

  // ── Tier 1: Local DB (instant, free) ──
  const local = await lookupLocal(word)

  // ── Tier 2: Free Dictionary API + Wiktionary (parallel, both free) ──
  const [freeApi, wiktionary] = await Promise.all([
    lookupFreeDictionaryApi(word),
    lookupWiktionary(word),
  ])

  // If we have local Persian OR free API OR Wiktionary, merge them
  if (local || freeApi || wiktionary) {
    // Merge meanings: prefer free API, append Wiktionary extras if any
    const meanings = [...(freeApi?.meanings || [])]
    if (wiktionary?.extraMeanings) {
      for (const wm of wiktionary.extraMeanings) {
        if (!meanings.some((m) => m.definitionEn === wm.definitionEn)) {
          meanings.push(wm)
        }
      }
    }
    return NextResponse.json(
      {
        word,
        persian: local?.persian || '',
        pos: local?.pos || freeApi?.meanings?.[0]?.pos || meanings[0]?.pos || '',
        phonetic: local?.phonetic || freeApi?.phonetic || '',
        audioUrl: freeApi?.audioUrl || null,
        meanings,
        source:
          local && freeApi
            ? 'local+api+wiktionary'
            : local
              ? 'local'
              : freeApi
                ? 'api+wiktionary'
                : 'wiktionary',
      },
      { headers: { 'Cache-Control': DICT_CACHE_CONTROL } },
    )
  }

  // ── Tier 3: Z-AI SDK fallback (for words not in local DB or free API) ──
  const result = await aiDictionary(word, context ?? '')
  if (!result) {
    return NextResponse.json(
      {
        error:
          'تعریف یافت نشد. لطفاً دوباره تلاش کنید یا کلمه را با املای درست وارد کنید.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(
    { ...result, source: 'ai' },
    { headers: { 'Cache-Control': DICT_CACHE_CONTROL } },
  )
}
