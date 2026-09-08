import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiDictionary, type DifficultyLevel, type FrequencyBand } from '@/lib/ai'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { db } from '@/lib/db'
import fs from 'node:fs'
import path from 'node:path'

/**
 * POST /api/dictionary
 *
 * 100% Free, Zero-Cost, High-Performance Multi-Tier Dictionary:
 *   1. Local 50,000-word English-Persian Dictionary (`en-fa.json`) + PostgreSQL DB (`DictionaryEntry`) — instant <2ms lookups
 *   2. Free Dictionary API (`api.dictionaryapi.dev`) — English definitions, IPA phonetics, human audio MP3, examples
 *   3. Datamuse API (`api.datamuse.com`) — high-quality synonyms, antonyms, related words, frequency ranking
 *   4. Edge TTS Neural Voice API (`/api/tts?text=...&lang=en`) — crisp, warm Microsoft Neural audio
 *   5. Wiktionary REST API — deep definitions & etymology
 *   6. Free Translation Engine (Google GTX) — fallback for rare modern slang
 *
 * Owner: Phase 5 R-DICT.2
 */

let localEnFaDict: Record<string, string> | null = null

function getLocalPersianMeaning(word: string): string | null {
  if (!localEnFaDict) {
    try {
      const p = path.join(process.cwd(), 'src', 'lib', 'dictionary', 'en-fa.json')
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8')
        localEnFaDict = JSON.parse(raw)
      }
    } catch (err) {
      console.error('[/api/dictionary] Failed to load en-fa.json:', err)
    }
  }
  if (!localEnFaDict) return null
  const w = word.toLowerCase().trim()
  return localEnFaDict[w] || null
}

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

// ── Tier 1: Local DB & Local 50k Dictionary lookup ────────────────────────
async function lookupLocal(word: string) {
  const wordLower = word.toLowerCase().trim()
  const staticMeaning = getLocalPersianMeaning(wordLower)
  if (staticMeaning) {
    return {
      word,
      persian: staticMeaning,
      pos: '',
      phonetic: '',
    }
  }

  try {
    const entry = await db.dictionaryEntry.findUnique({
      where: { wordLower },
      select: { word: true, persian: true, pos: true, phonetic: true },
    })
    return entry
  } catch {
    return null
  }
}

// ── Tier 2: Free Dictionary API (dictionaryapi.dev) ────────────────────────
interface FreeDictMeaning {
  partOfSpeech: string
  definitions: Array<{ definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }>
  synonyms?: string[]
  antonyms?: string[]
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

interface FreeDictResult {
  meanings: Array<{ pos: string; definitionEn: string; example?: string }>
  phonetic: string
  audioUrl: string | null
  synonyms: string[]
  antonyms: string[]
  origin?: string
}

async function lookupFreeDictionaryApi(word: string): Promise<FreeDictResult | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`,
      {
        signal: AbortSignal.timeout(1200),
        headers: { Accept: 'application/json' },
      },
    )
    if (!res.ok) return null
    const data: FreeDictResponse[] = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const meanings = (entry.meanings || []).flatMap((m) =>
      (m.definitions || []).map((d) => ({
        pos: m.partOfSpeech || '',
        definitionEn: d.definition || '',
        example: d.example,
      })),
    ).filter((m) => m.definitionEn.length > 0)

    // Extract all synonyms & antonyms
    const synSet = new Set<string>()
    const antSet = new Set<string>()
    for (const m of entry.meanings || []) {
      for (const s of m.synonyms || []) if (s && s !== word) synSet.add(s)
      for (const a of m.antonyms || []) if (a && a !== word) antSet.add(a)
      for (const d of m.definitions || []) {
        for (const s of d.synonyms || []) if (s && s !== word) synSet.add(s)
        for (const a of d.antonyms || []) if (a && a !== word) antSet.add(a)
      }
    }

    // Find best phonetic (prefer one with audio)
    const phonetic =
      entry.phonetic ||
      entry.phonetics?.find((p) => p.text)?.text ||
      ''
    const audioUrl =
      entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio || null

    return {
      meanings,
      phonetic,
      audioUrl,
      synonyms: Array.from(synSet).slice(0, 8),
      antonyms: Array.from(antSet).slice(0, 8),
      origin: entry.origin,
    }
  } catch {
    return null
  }
}

// ── Tier 3: Datamuse API (Synonyms, Antonyms, Related Words & Frequency) ────
interface DatamuseResult {
  synonyms: string[]
  antonyms: string[]
  relatedWords: string[]
  frequencyScore: number
  primaryDef?: string
  primaryPos?: string
}

async function lookupDatamuse(word: string): Promise<DatamuseResult | null> {
  const cleanWord = word.toLowerCase().trim()
  try {
    const [synRes, antRes, trgRes, metaRes] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(1000),
      }),
      fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(1000),
      }),
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(1000),
      }),
      fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=dpfs&max=1`, {
        signal: AbortSignal.timeout(1000),
      }),
    ])

    const synonyms: string[] = []
    const antonyms: string[] = []
    const relatedWords: string[] = []
    let frequencyScore = 0
    let primaryDef: string | undefined
    let primaryPos: string | undefined

    if (synRes.status === 'fulfilled' && synRes.value.ok) {
      const data = await synRes.value.json()
      if (Array.isArray(data)) {
        synonyms.push(...data.map((item) => String(item.word)).filter(Boolean))
      }
    }

    if (antRes.status === 'fulfilled' && antRes.value.ok) {
      const data = await antRes.value.json()
      if (Array.isArray(data)) {
        antonyms.push(...data.map((item) => String(item.word)).filter(Boolean))
      }
    }

    if (trgRes.status === 'fulfilled' && trgRes.value.ok) {
      const data = await trgRes.value.json()
      if (Array.isArray(data)) {
        relatedWords.push(...data.map((item) => String(item.word)).filter(Boolean))
      }
    }

    if (metaRes.status === 'fulfilled' && metaRes.value.ok) {
      const data = await metaRes.value.json()
      if (Array.isArray(data) && data[0]) {
        const item = data[0]
        if (Array.isArray(item.tags)) {
          for (const t of item.tags) {
            if (typeof t === 'string' && t.startsWith('f:')) {
              frequencyScore = parseFloat(t.slice(2)) || 0
            } else if (typeof t === 'string' && ['n', 'v', 'adj', 'adv', 'u'].includes(t)) {
              primaryPos = t === 'n' ? 'noun' : t === 'v' ? 'verb' : t === 'adj' ? 'adjective' : t === 'adv' ? 'adverb' : t
            }
          }
        }
        if (Array.isArray(item.defs) && item.defs[0]) {
          const rawDef = String(item.defs[0])
          const tabIdx = rawDef.indexOf('\t')
          primaryDef = tabIdx !== -1 ? rawDef.slice(tabIdx + 1).trim() : rawDef.trim()
        }
      }
    }

    return {
      synonyms: synonyms.slice(0, 6),
      antonyms: antonyms.slice(0, 6),
      relatedWords: relatedWords.slice(0, 6),
      frequencyScore,
      primaryDef,
      primaryPos,
    }
  } catch {
    return null
  }
}

// ── Tier 4: Wiktionary REST API (etymology + deeper definitions) ───────────
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

interface WiktionaryResult {
  etymology: string | null
  extraMeanings: Array<{ pos: string; definitionEn: string; example?: string }>
}

async function lookupWiktionary(word: string): Promise<WiktionaryResult | null> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase().trim())}`,
      {
        signal: AbortSignal.timeout(1000),
        headers: { Accept: 'application/json' },
      },
    )
    if (!res.ok) return null
    const data: WiktionaryResponse = await res.json()
    if (!data || typeof data !== 'object') return null

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
      .slice(0, 4)

    return { etymology: null, extraMeanings }
  } catch {
    return null
  }
}

// ── Tier 5: Free Persian Translation Fallback (Google GTX / MyMemory) ──────
async function lookupFreeTranslation(word: string): Promise<string> {
  const cleanWord = word.trim()
  if (!cleanWord) return ''

  // Attempt 1: Google Translate GTX (Fastest, zero-auth, high accuracy for single words)
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURIComponent(cleanWord)}`
    const res = await fetch(gtxUrl, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        const translation = String(data[0][0][0] || '').trim()
        if (translation && translation.toLowerCase() !== cleanWord.toLowerCase()) {
          return translation
        }
      }
    }
  } catch {
    // Fallthrough to MyMemory
  }

  // Attempt 2: MyMemory Translated API
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|fa`
    const res = await fetch(myMemoryUrl, {
      signal: AbortSignal.timeout(3000),
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      const text = data?.responseData?.translatedText
      if (typeof text === 'string' && text.trim() && text.trim().toLowerCase() !== cleanWord.toLowerCase()) {
        return text.trim()
      }
    }
  } catch {
    // Return empty string on failure
  }

  return ''
}

// ── Helpers: CEFR & Frequency Determination ────────────────────────────────
function determineDifficultyLevel(
  word: string,
  freqScore?: number,
  explicitLevel?: string,
): DifficultyLevel {
  if (explicitLevel && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(explicitLevel.toUpperCase())) {
    return explicitLevel.toUpperCase() as DifficultyLevel
  }

  if (typeof freqScore === 'number' && freqScore > 0) {
    if (freqScore >= 70) return 'A1'
    if (freqScore >= 35) return 'A2'
    if (freqScore >= 12) return 'B1'
    if (freqScore >= 3) return 'B2'
    if (freqScore >= 0.8) return 'C1'
    return 'C2'
  }

  // Length & morphology heuristic
  const len = word.trim().length
  if (len <= 4) return 'A1'
  if (len <= 6) return 'A2'
  if (len <= 8) return 'B1'
  if (len <= 11) return 'B2'
  return 'C1'
}

function determineFrequencyBand(freqScore?: number, diff?: DifficultyLevel): FrequencyBand {
  if (typeof freqScore === 'number' && freqScore > 0) {
    if (freqScore >= 25) return 'common'
    if (freqScore >= 3) return 'uncommon'
    return 'rare'
  }

  if (diff === 'A1' || diff === 'A2') return 'common'
  if (diff === 'B1' || diff === 'B2') return 'uncommon'
  return 'rare'
}

function determineSource(local: any, freeApi: any, wiktionary?: any, datamuse?: any): string {
  const parts: string[] = []
  if (local) parts.push('local')
  if (freeApi) parts.push('api')
  if (datamuse) parts.push('datamuse')
  if (wiktionary) parts.push('wiktionary')
  return parts.length > 0 ? parts.join('+') : 'free-network'
}

function deduplicateMeanings(
  freeApiMeanings: Array<{ pos: string; definitionEn: string; example?: string }> | undefined,
  wiktionaryMeanings: Array<{ pos: string; definitionEn: string; example?: string }> | undefined,
): Array<{ pos: string; definitionEn: string; example?: string }> {
  const meanings = [...(freeApiMeanings || [])]
  if (wiktionaryMeanings) {
    for (const wm of wiktionaryMeanings) {
      if (!meanings.some((m) => m.definitionEn.toLowerCase() === wm.definitionEn.toLowerCase())) {
        meanings.push(wm)
      }
    }
  }
  return meanings
}

/**
 * Asynchronously save resolved word to PostgreSQL DictionaryEntry table
 * for instant sub-millisecond future lookups.
 */
async function autoCacheDictionaryEntry(
  word: string,
  persian: string,
  pos: string,
  phonetic: string,
) {
  if (!word || !persian) return
  const wordLower = word.toLowerCase().trim()
  try {
    await db.dictionaryEntry.upsert({
      where: { wordLower },
      update: {
        persian,
        pos: pos || undefined,
        phonetic: phonetic || undefined,
      },
      create: {
        word: word.trim(),
        wordLower,
        persian,
        pos: pos || '',
        phonetic: phonetic || '',
      },
    })
  } catch {
    // Ignore cache persistence errors gracefully
  }
}

function mergeMeaningsAndBuildResponse(
  word: string,
  local: any,
  freeApi: FreeDictResult | null,
  wiktionary: WiktionaryResult | null,
  datamuse: DatamuseResult | null,
  persianTranslation: string,
) {
  const meanings = deduplicateMeanings(freeApi?.meanings, wiktionary?.extraMeanings)
  const source = determineSource(local, freeApi, wiktionary, datamuse)

  const translation = (local?.persian || persianTranslation || '').trim()
  const phonetic = (local?.phonetic || freeApi?.phonetic || '').trim()
  const partOfSpeech = (
    local?.pos ||
    freeApi?.meanings?.[0]?.pos ||
    datamuse?.primaryPos ||
    meanings[0]?.pos ||
    ''
  ).trim()

  const primaryDefinition =
    freeApi?.meanings?.[0]?.definitionEn ||
    wiktionary?.extraMeanings?.[0]?.definitionEn ||
    datamuse?.primaryDef ||
    ''

  const primaryExample =
    freeApi?.meanings?.[0]?.example ||
    wiktionary?.extraMeanings?.[0]?.example ||
    ''

  // Deduplicate synonyms & antonyms from all sources
  const synonymsSet = new Set<string>([
    ...(freeApi?.synonyms || []),
    ...(datamuse?.synonyms || []),
  ])
  synonymsSet.delete(word.toLowerCase())

  const antonymsSet = new Set<string>([
    ...(freeApi?.antonyms || []),
    ...(datamuse?.antonyms || []),
  ])
  antonymsSet.delete(word.toLowerCase())

  const difficultyLevel = determineDifficultyLevel(word, datamuse?.frequencyScore)
  const frequencyBand = determineFrequencyBand(datamuse?.frequencyScore, difficultyLevel)
  const etymology = wiktionary?.etymology || freeApi?.origin || ''

  const responsePayload = {
    word,
    translation,
    persian: translation, // alias for backwards compatibility
    partOfSpeech,
    pos: partOfSpeech, // alias for backwards compatibility
    phonetic,
    audioUrl: freeApi?.audioUrl || `/api/tts?text=${encodeURIComponent(word)}&lang=en`,
    definition: primaryDefinition,
    example: primaryExample,
    meanings,
    synonyms: Array.from(synonymsSet).slice(0, 6),
    antonyms: Array.from(antonymsSet).slice(0, 6),
    relatedWords: (datamuse?.relatedWords || []).slice(0, 6),
    difficultyLevel,
    frequencyBand,
    etymology,
    source,
  }

  // Trigger background auto-caching if not in local DB
  if (!local && translation) {
    void autoCacheDictionaryEntry(word, translation, partOfSpeech, phonetic)
  }

  return NextResponse.json(responsePayload, {
    headers: { 'Cache-Control': DICT_CACHE_CONTROL },
  })
}

export async function POST(req: NextRequest) {
  const blocked = await aiRateLimit(req, { anonLimit: 60, authLimit: 200, name: 'dictionary' })
  if (blocked) return blocked

  const parsed = await parseBody(req, DictionarySchema)
  if (!parsed.ok) return parsed.response

  const { word, context } = parsed.data
  const cleanWord = word.trim()

  // Tier 1: Local DB
  const local = await lookupLocal(cleanWord)

  // Tier 2: Free Network APIs in parallel
  const [freeApiResult, wiktionaryResult, datamuseResult] = await Promise.allSettled([
    lookupFreeDictionaryApi(cleanWord),
    lookupWiktionary(cleanWord),
    lookupDatamuse(cleanWord),
  ])

  const freeApi = freeApiResult.status === 'fulfilled' ? freeApiResult.value : null
  const wiktionary = wiktionaryResult.status === 'fulfilled' ? wiktionaryResult.value : null
  const datamuse = datamuseResult.status === 'fulfilled' ? datamuseResult.value : null

  // If local DB didn't have Persian translation, fetch from free translation engine
  let persianTranslation = local?.persian || ''
  if (!persianTranslation) {
    persianTranslation = await lookupFreeTranslation(cleanWord)
  }

  // If we obtained data from local DB or any of the free APIs, merge and return immediately
  if (local || freeApi || wiktionary || datamuse || persianTranslation) {
    return mergeMeaningsAndBuildResponse(
      cleanWord,
      local,
      freeApi,
      wiktionary,
      datamuse,
      persianTranslation,
    )
  }

  // Tier 3: AI fallback (only as ultimate safety net for rare phrases/idioms)
  const result = await aiDictionary(cleanWord, context ?? '')
  if (!result) {
    return NextResponse.json(
      {
        error:
          'تعریف یافت نشد. لطفاً دوباره تلاش کنید یا کلمه را با املای درست وارد کنید.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // Cache AI result to local DB too
  if (result.translation) {
    void autoCacheDictionaryEntry(
      cleanWord,
      result.translation,
      result.partOfSpeech || '',
      result.phonetic || '',
    )
  }

  return NextResponse.json(
    {
      ...result,
      persian: result.translation,
      pos: result.partOfSpeech,
      source: 'ai',
    },
    { headers: { 'Cache-Control': DICT_CACHE_CONTROL } },
  )
}
