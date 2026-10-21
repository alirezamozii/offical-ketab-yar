import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiDictionary, type DifficultyLevel, type FrequencyBand } from '@/lib/ai';
import { aiRateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/api-validate';
import { db } from '@/lib/db';
import fs from 'node:fs';
import path from 'node:path';

/**
 * POST /api/dictionary
 *
 * Free, zero-cost, anti-fragile multi-tier hybrid dictionary aggregator.
 * Every network source runs IN PARALLEL (Promise.allSettled) and results are
 * merged, so the response time is the slowest single source (~300-400ms
 * typical), never the sum. Any source can fail without breaking the rest.
 *
 *   Tier 0  In-memory TTL cache (hot words, sub-millisecond)
 *   Tier 1  Local 50k en→fa JSON + PostgreSQL DictionaryEntry (instant)
 *   Tier 2  Google Dictionary endpoint (`dt=bd`, the Chrome-extension dict)
 *           — multi-meaning Persian translations grouped by part of speech
 *             with reverse translations; the highest-quality free en→fa source
 *   Tier 3  Free Dictionary API (dictionaryapi.dev)
 *           — English definitions, IPA phonetics, human audio MP3, examples
 *   Tier 4  Datamuse — synonyms, antonyms, related words, frequency (CEFR)
 *   Tier 5  Wiktionary REST — deeper definitions
 *   Tier 6  MyMemory — Persian fallback when Google is unreachable
 *   Tier 7  AI dictionary — last resort for rare phrases/idioms
 */

// ── Tier 0: in-memory TTL cache ────────────────────────────────────────────
interface MemCacheEntry {
  at: number;
  payload: Record<string, unknown>;
}
const MEM_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MEM_CACHE_MAX = 1000;
const memCache = new Map<string, MemCacheEntry>();

function memGet(key: string): Record<string, unknown> | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > MEM_CACHE_TTL_MS) {
    memCache.delete(key);
    return null;
  }
  return hit.payload;
}

function memSet(key: string, payload: Record<string, unknown>) {
  if (memCache.size >= MEM_CACHE_MAX) {
    const oldest = memCache.keys().next().value;
    if (oldest !== undefined) memCache.delete(oldest);
  }
  memCache.set(key, { at: Date.now(), payload });
}

let localEnFaDict: Record<string, string> | null = null;

function getLocalPersianMeaning(word: string): string | null {
  if (!localEnFaDict) {
    try {
      const p = path.join(process.cwd(), 'src', 'lib', 'dictionary', 'en-fa.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        localEnFaDict = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[/api/dictionary] Failed to load en-fa.json:', err);
    }
  }
  if (!localEnFaDict) return null;
  const w = word.toLowerCase().trim();
  return localEnFaDict[w] || null;
}

const DICT_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800';

const MAX_WORD_CHARS = 200;
const MAX_CONTEXT_CHARS = 2_000;

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
});

// ── Tier 1: Local DB & local 50k dictionary ────────────────────────────────
interface LocalResult {
  word: string;
  persian: string;
  pos: string;
  phonetic: string;
}

async function lookupLocal(word: string): Promise<LocalResult | null> {
  const wordLower = word.toLowerCase().trim();
  const staticMeaning = getLocalPersianMeaning(wordLower);
  if (staticMeaning) {
    return { word, persian: staticMeaning, pos: '', phonetic: '' };
  }
  try {
    return await db.dictionaryEntry.findUnique({
      where: { wordLower },
      select: { word: true, persian: true, pos: true, phonetic: true },
    });
  } catch {
    return null;
  }
}

// ── Tier 2: Google Dictionary endpoint (multi-meaning en→fa by POS) ────────
export interface PersianMeaningGroup {
  partOfSpeech: string;
  translations: Array<{
    persian: string;
    backTranslations: string[];
  }>;
}

interface GoogleDictResult {
  primaryTranslation: string;
  persianMeaningsByPos: PersianMeaningGroup[];
  relatedWords: string[];
  romanization: string;
}

interface GoogleDictEntry {
  word?: string;
  reverse_translation?: string[];
}
interface GoogleDictPos {
  pos?: string;
  entry?: GoogleDictEntry[];
  terms?: string[];
}

async function lookupGoogleDict(word: string): Promise<GoogleDictResult | null> {
  const clean = word.trim();
  if (!clean) return null;
  try {
    // dt=t  → sentence translation (works for words AND phrases)
    // dt=bd → the dictionary block: meanings grouped by POS + reverse translations
    // dt=rm → romanization / IPA-ish transliteration
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&hl=en` +
      `&dt=t&dt=bd&dt=rm&dj=1&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;

    let primaryTranslation = '';
    if (Array.isArray(data.sentences)) {
      primaryTranslation = data.sentences
        .map((s: { trans?: string }) => s.trans || '')
        .join('')
        .trim();
    }

    // Romanization lives in a trailing sentence object (src_translit)
    let romanization = '';
    if (Array.isArray(data.sentences)) {
      for (const s of data.sentences as Array<{ src_translit?: string }>) {
        if (s.src_translit) {
          romanization = s.src_translit.trim();
          break;
        }
      }
    }

    const persianMeaningsByPos: PersianMeaningGroup[] = [];
    if (Array.isArray(data.dict)) {
      const seenPersian = new Set<string>();
      for (const d of data.dict as unknown as GoogleDictPos[]) {
        const entries = (d.entry || []).filter((e) => e.word && e.word.trim());
        if (!entries.length) continue;
        const translations = entries.slice(0, 6).flatMap((e) => {
          const persian = e.word!.trim();
          const key = `${d.pos || ''}:${persian}`;
          if (seenPersian.has(key)) return [];
          seenPersian.add(key);
          return [
            {
              persian,
              backTranslations: (e.reverse_translation || []).slice(0, 3),
            },
          ];
        });
        if (translations.length) {
          persianMeaningsByPos.push({
            partOfSpeech: d.pos || '',
            translations,
          });
        }
      }
    }

    const relatedWords: string[] = Array.isArray(data.related)
      ? (data.related as string[]).filter((w) => typeof w === 'string' && w.trim()).slice(0, 6)
      : [];

    return { primaryTranslation, persianMeaningsByPos, relatedWords, romanization };
  } catch {
    return null;
  }
}

// ── Tier 3: Free Dictionary API (dictionaryapi.dev) ────────────────────────
interface FreeDictMeaning {
  partOfSpeech: string;
  definitions: Array<{
    definition: string;
    example?: string;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  synonyms?: string[];
  antonyms?: string[];
}
interface FreeDictPhonetic {
  text?: string;
  audio?: string;
}
interface FreeDictResponse {
  word: string;
  phonetic?: string;
  phonetics: FreeDictPhonetic[];
  meanings: FreeDictMeaning[];
  origin?: string;
}

interface FreeDictResult {
  meanings: Array<{ pos: string; definitionEn: string; example?: string }>;
  phonetic: string;
  audioUrl: string | null;
  synonyms: string[];
  antonyms: string[];
  origin?: string;
}

async function lookupFreeDictionaryApi(word: string): Promise<FreeDictResult | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`,
      {
        signal: AbortSignal.timeout(1500),
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) return null;
    const data: FreeDictResponse[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const meanings = (entry.meanings || [])
      .flatMap((m) =>
        (m.definitions || []).map((d) => ({
          pos: m.partOfSpeech || '',
          definitionEn: d.definition || '',
          example: d.example,
        })),
      )
      .filter((m) => m.definitionEn.length > 0);

    const synSet = new Set<string>();
    const antSet = new Set<string>();
    for (const m of entry.meanings || []) {
      for (const s of m.synonyms || []) if (s && s !== word) synSet.add(s);
      for (const a of m.antonyms || []) if (a && a !== word) antSet.add(a);
      for (const d of m.definitions || []) {
        for (const s of d.synonyms || []) if (s && s !== word) synSet.add(s);
        for (const a of d.antonyms || []) if (a && a !== word) antSet.add(a);
      }
    }

    const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
    const audioUrl = entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio || null;

    return {
      meanings,
      phonetic,
      audioUrl,
      synonyms: Array.from(synSet).slice(0, 8),
      antonyms: Array.from(antSet).slice(0, 8),
      origin: entry.origin,
    };
  } catch {
    return null;
  }
}

// ── Tier 4: Datamuse (synonyms, antonyms, related, frequency) ──────────────
interface DatamuseResult {
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  frequencyScore: number;
  primaryDef?: string;
  primaryPos?: string;
}

async function lookupDatamuse(word: string): Promise<DatamuseResult | null> {
  const cleanWord = word.toLowerCase().trim();
  try {
    const [synRes, antRes, trgRes, metaRes] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(2200),
      }),
      fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(2200),
      }),
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(cleanWord)}&max=8`, {
        signal: AbortSignal.timeout(2200),
      }),
      fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=dpfs&max=1`, {
        signal: AbortSignal.timeout(2200),
      }),
    ]);

    const synonyms: string[] = [];
    const antonyms: string[] = [];
    const relatedWords: string[] = [];
    let frequencyScore = 0;
    let primaryDef: string | undefined;
    let primaryPos: string | undefined;

    if (synRes.status === 'fulfilled' && synRes.value.ok) {
      const data = await synRes.value.json();
      if (Array.isArray(data)) {
        synonyms.push(...data.map((item) => String(item.word)).filter(Boolean));
      }
    }

    if (antRes.status === 'fulfilled' && antRes.value.ok) {
      const data = await antRes.value.json();
      if (Array.isArray(data)) {
        antonyms.push(...data.map((item) => String(item.word)).filter(Boolean));
      }
    }

    if (trgRes.status === 'fulfilled' && trgRes.value.ok) {
      const data = await trgRes.value.json();
      if (Array.isArray(data)) {
        relatedWords.push(...data.map((item) => String(item.word)).filter(Boolean));
      }
    }

    if (metaRes.status === 'fulfilled' && metaRes.value.ok) {
      const data = await metaRes.value.json();
      if (Array.isArray(data) && data[0]) {
        const item = data[0];
        if (Array.isArray(item.tags)) {
          for (const t of item.tags) {
            if (typeof t === 'string' && t.startsWith('f:')) {
              frequencyScore = parseFloat(t.slice(2)) || 0;
            } else if (typeof t === 'string' && ['n', 'v', 'adj', 'adv', 'u'].includes(t)) {
              primaryPos =
                t === 'n'
                  ? 'noun'
                  : t === 'v'
                    ? 'verb'
                    : t === 'adj'
                      ? 'adjective'
                      : t === 'adv'
                        ? 'adverb'
                        : t;
            }
          }
        }
        if (Array.isArray(item.defs) && item.defs[0]) {
          const rawDef = String(item.defs[0]);
          const tabIdx = rawDef.indexOf('\t');
          primaryDef = tabIdx !== -1 ? rawDef.slice(tabIdx + 1).trim() : rawDef.trim();
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
    };
  } catch {
    return null;
  }
}

// ── Tier 5: Wiktionary REST (deeper definitions) ───────────────────────────
interface WiktionaryDefinition {
  definition: string;
  parsedExamples?: Array<{ example: string }>;
}
interface WiktionaryLanguageEntry {
  partOfSpeech: string;
  language: string;
  definitions: WiktionaryDefinition[];
}
interface WiktionaryResponse {
  [language: string]: WiktionaryLanguageEntry[];
}

interface WiktionaryResult {
  etymology: string | null;
  extraMeanings: Array<{ pos: string; definitionEn: string; example?: string }>;
}

async function lookupWiktionary(word: string): Promise<WiktionaryResult | null> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase().trim())}`,
      {
        signal: AbortSignal.timeout(2500),
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) return null;
    const data: WiktionaryResponse = await res.json();
    if (!data || typeof data !== 'object') return null;

    const enEntries = data.en || [];
    const extraMeanings = enEntries
      .flatMap((entry) =>
        (entry.definitions || []).map((def) => ({
          pos: entry.partOfSpeech || '',
          definitionEn: def.definition?.replace(/<[^>]+>/g, '').trim() || '',
          example: def.parsedExamples?.[0]?.example?.replace(/<[^>]+>/g, '').trim(),
        })),
      )
      .filter((m) => m.definitionEn.length > 0)
      .slice(0, 4);

    return { etymology: null, extraMeanings };
  } catch {
    return null;
  }
}

// ── Tier 6: MyMemory (Persian fallback when Google fails) ──────────────────
async function lookupMyMemory(word: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.trim())}&langpair=en|fa`,
      { signal: AbortSignal.timeout(2500), headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return '';
    const data = await res.json();
    const text = data?.responseData?.translatedText;
    if (
      typeof text === 'string' &&
      text.trim() &&
      !/^[A-Z\s]+$/i.test(text.trim()) && // MyMemory returns ALL-CAPS errors like "QUERY LENGTH LIMIT"
      text.trim().toLowerCase() !== word.trim().toLowerCase()
    ) {
      return text.trim();
    }
    return '';
  } catch {
    return '';
  }
}

// ── Helpers: CEFR & frequency ──────────────────────────────────────────────
function determineDifficultyLevel(
  word: string,
  freqScore?: number,
  explicitLevel?: string,
): DifficultyLevel {
  if (explicitLevel && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(explicitLevel.toUpperCase())) {
    return explicitLevel.toUpperCase() as DifficultyLevel;
  }

  if (typeof freqScore === 'number' && freqScore > 0) {
    if (freqScore >= 70) return 'A1';
    if (freqScore >= 35) return 'A2';
    if (freqScore >= 12) return 'B1';
    if (freqScore >= 3) return 'B2';
    if (freqScore >= 0.8) return 'C1';
    return 'C2';
  }

  const len = word.trim().length;
  if (len <= 4) return 'A1';
  if (len <= 6) return 'A2';
  if (len <= 8) return 'B1';
  if (len <= 11) return 'B2';
  return 'C1';
}

function determineFrequencyBand(freqScore?: number, diff?: DifficultyLevel): FrequencyBand {
  if (typeof freqScore === 'number' && freqScore > 0) {
    if (freqScore >= 25) return 'common';
    if (freqScore >= 3) return 'uncommon';
    return 'rare';
  }
  if (diff === 'A1' || diff === 'A2') return 'common';
  if (diff === 'B1' || diff === 'B2') return 'uncommon';
  return 'rare';
}

function deduplicateMeanings(
  freeApiMeanings: Array<{ pos: string; definitionEn: string; example?: string }> | undefined,
  wiktionaryMeanings: Array<{ pos: string; definitionEn: string; example?: string }> | undefined,
): Array<{ pos: string; definitionEn: string; example?: string }> {
  const meanings = [...(freeApiMeanings || [])];
  if (wiktionaryMeanings) {
    for (const wm of wiktionaryMeanings) {
      if (!meanings.some((m) => m.definitionEn.toLowerCase() === wm.definitionEn.toLowerCase())) {
        meanings.push(wm);
      }
    }
  }
  return meanings;
}

/**
 * Persist resolved word to the DictionaryEntry table so future lookups of
 * cold words resolve from the local DB without any network call.
 */
async function autoCacheDictionaryEntry(
  word: string,
  persian: string,
  pos: string,
  phonetic: string,
) {
  if (!word || !persian) return;
  const wordLower = word.toLowerCase().trim();
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
    });
  } catch {
    // Cache persistence is best-effort
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const blocked = await aiRateLimit(req, { anonLimit: 60, authLimit: 200, name: 'dictionary' });
  if (blocked) return blocked;

  const parsed = await parseBody(req, DictionarySchema);
  if (!parsed.ok) return parsed.response;

  const { word, context } = parsed.data;
  const cleanWord = word.trim();
  const cacheKey = cleanWord.toLowerCase();

  // Tier 0: hot in-memory cache
  const cached = memGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': DICT_CACHE_CONTROL } });
  }

  // Tier 1 + Tiers 2-5 all launched together: local DB lookup races the
  // network sources; nothing waits for anything it doesn't need.
  const [localRes, googleRes, freeApiRes, datamuseRes, wiktionaryRes] = await Promise.allSettled([
    lookupLocal(cleanWord),
    lookupGoogleDict(cleanWord),
    lookupFreeDictionaryApi(cleanWord),
    lookupDatamuse(cleanWord),
    lookupWiktionary(cleanWord),
  ]);

  const local = localRes.status === 'fulfilled' ? localRes.value : null;
  const google = googleRes.status === 'fulfilled' ? googleRes.value : null;
  const freeApi = freeApiRes.status === 'fulfilled' ? freeApiRes.value : null;
  const datamuse = datamuseRes.status === 'fulfilled' ? datamuseRes.value : null;
  const wiktionary = wiktionaryRes.status === 'fulfilled' ? wiktionaryRes.value : null;

  // Persian translation priority: Google dict (clean, structured) →
  // local 50k/DB → MyMemory fallback (only when both above are empty).
  let translation = google?.primaryTranslation || local?.persian || '';
  if (!translation) {
    translation = await lookupMyMemory(cleanWord);
  }

  if (local || google || freeApi || wiktionary || datamuse || translation) {
    const meanings = deduplicateMeanings(freeApi?.meanings, wiktionary?.extraMeanings);
    const synonymsSet = new Set<string>([
      ...(freeApi?.synonyms || []),
      ...(datamuse?.synonyms || []),
    ]);
    synonymsSet.delete(cleanWord.toLowerCase());
    const antonymsSet = new Set<string>([
      ...(freeApi?.antonyms || []),
      ...(datamuse?.antonyms || []),
    ]);
    antonymsSet.delete(cleanWord.toLowerCase());
    const relatedSet = new Set<string>([
      ...(datamuse?.relatedWords || []),
      ...(google?.relatedWords || []),
    ]);
    relatedSet.delete(cleanWord.toLowerCase());

    const partOfSpeech = (
      google?.persianMeaningsByPos?.[0]?.partOfSpeech ||
      local?.pos ||
      freeApi?.meanings?.[0]?.pos ||
      datamuse?.primaryPos ||
      meanings[0]?.pos ||
      ''
    ).trim();

    const phonetic = (
      freeApi?.phonetic ||
      local?.phonetic ||
      (google?.romanization ? `/${google.romanization}/` : '') ||
      ''
    ).trim();

    const difficultyLevel = determineDifficultyLevel(cleanWord, datamuse?.frequencyScore);
    const frequencyBand = determineFrequencyBand(datamuse?.frequencyScore, difficultyLevel);

    const persianMeaningsByPos = google?.persianMeaningsByPos || [];
    const synonyms = Array.from(synonymsSet).slice(0, 8);
    const antonyms = Array.from(antonymsSet).slice(0, 8);
    const relatedWords = Array.from(relatedSet).slice(0, 8);
    const definition =
      freeApi?.meanings?.[0]?.definitionEn ||
      wiktionary?.extraMeanings?.[0]?.definitionEn ||
      datamuse?.primaryDef ||
      '';

    // Only cache responses that carry real structure; a bare translation
    // from a degraded network state should be retried on the next request.
    const isRich =
      persianMeaningsByPos.length > 0 ||
      meanings.length > 0 ||
      synonyms.length > 0 ||
      antonyms.length > 0 ||
      Boolean(definition);
    const payload: Record<string, unknown> = {
      word: cleanWord,
      translation,
      persian: translation, // backwards-compat alias
      persianMeaningsByPos: google?.persianMeaningsByPos || [],
      partOfSpeech,
      pos: partOfSpeech, // backwards-compat alias
      phonetic,
      audioUrl: `/api/tts?text=${encodeURIComponent(cleanWord)}&lang=en`,
      definition:
        freeApi?.meanings?.[0]?.definitionEn ||
        wiktionary?.extraMeanings?.[0]?.definitionEn ||
        datamuse?.primaryDef ||
        '',
      example: freeApi?.meanings?.[0]?.example || wiktionary?.extraMeanings?.[0]?.example || '',
      meanings,
      synonyms,
      antonyms,
      relatedWords,
      difficultyLevel,
      frequencyBand,
      etymology: wiktionary?.etymology || freeApi?.origin || '',
      source:
        [
          local ? 'local' : null,
          google?.persianMeaningsByPos?.length ? 'google-dict' : null,
          freeApi ? 'api' : null,
          datamuse ? 'datamuse' : null,
          wiktionary ? 'wiktionary' : null,
        ]
          .filter(Boolean)
          .join('+') || 'free-network',
    };

    if (isRich) memSet(cacheKey, payload);

    // Persist the resolved translation for cold-start lookups
    if (!local && translation) {
      void autoCacheDictionaryEntry(cleanWord, translation, partOfSpeech, phonetic);
    }

    return NextResponse.json(payload, { headers: { 'Cache-Control': DICT_CACHE_CONTROL } });
  }

  // ── Degraded-response guard ───────────────────────────────────────────────
  // We have *something* (e.g. only a bare translation) but no structured
  // content: serve it without caching it, so a transient upstream outage
  // (dictionaryapi.dev 530s regularly) doesn't pin a hollow payload for days.

  // Tier 7: AI fallback — rare phrases/idioms the free sources don't know
  const result = await aiDictionary(cleanWord, context ?? '');
  if (!result) {
    return NextResponse.json(
      { error: 'تعریف یافت نشد. لطفاً دوباره تلاش کنید یا کلمه را با املای درست وارد کنید.' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (result.translation) {
    void autoCacheDictionaryEntry(
      cleanWord,
      result.translation,
      result.partOfSpeech || '',
      result.phonetic || '',
    );
  }

  const aiPayload = {
    ...result,
    persian: result.translation,
    pos: result.partOfSpeech,
    source: 'ai',
  };
  return NextResponse.json(aiPayload, { headers: { 'Cache-Control': DICT_CACHE_CONTROL } });
}
