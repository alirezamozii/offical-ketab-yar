import ZAI from 'z-ai-web-dev-sdk'

let cached: ZAI | null = null

async function getClient(): Promise<ZAI> {
  if (cached) return cached
  cached = await ZAI.create()
  return cached
}

export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

/** CEFR difficulty level for a word. */
export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** How common the word is in everyday English. */
export type FrequencyBand = 'common' | 'uncommon' | 'rare'

export interface DictionaryResult {
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  translation: string
  example: string
  synonyms: string[]
  antonyms: string[]
  difficultyLevel: DifficultyLevel
  frequencyBand: FrequencyBand
  relatedWords: string[]
  etymology: string
}

export interface TranslateResult {
  translation: string
  notes: string
}

/**
 * Centralized system prompts. Each is intentionally explicit about output language,
 * format, and what NOT to include (no markdown headings, no preambles).
 */
export const SYSTEM_PROMPTS = {
  CHAT: `تو معلم خصوصی زبان انگلیسی برای یک کاربر فارسی‌زبان هستی که در حال خواندن یک کتاب دوزبانه است. پاسخ همیشه به فارسی و راست‌به‌چپ است، مگر آنکه کاربر صریحاً انگلیسی بخواهد.

قوانین پاسخ‌دهی بر اساس نوع پرسش:

۱) اگر کاربر درباره‌ی یک «کلمه» می‌پرسد:
با این برچسب‌ها و به همین ترتیب پاسخ بده (هر کدام در یک خط، اگر نامربوط بود آن خط را حذف کن):
معنی: <ترجمه فارسی کوتاه>
نوع کلمه: <اسم/فعل/صفت/قید/...>
تلفظ: <تلفظ تقریبی با حروف فارسی یا IPA>
مثال: <یک جمله کوتاه انگلیسی با آن کلمه>
ریشه‌شناسی: <اگر مطمئن هستی، یک خط کوتاه درباره‌ی ریشه‌ی لاتین/یونانی/...؛ اگر مطمئن نیستی، این خط را کلاً حذف کن>

۲) اگر کاربر درباره‌ی یک «عبارت یا جمله» می‌پرسد:
ابتدا «ترجمه:» وفادار و روان، سپس «نکته:» یک خط درباره‌ی زمان فعل / ساختار / اصطلاح فرهنگی.

۳) اگر کاربر درباره‌ی «پیرنگ / شخصیت / موضوع کتاب» می‌پرسد:
فقط بر اساس متن صفحه‌ای که در دسترس داری پاسخ بده. اگر در متن نیست، صادقانه بگو: «این در متن این صفحه نیست.»

۴) اگر کاربر «توضیح گرامر» خواست:
زمان/ساختار را نام ببر، قانون را در یک خط بنویس، و یک عبارت از متن همین صفحه را به‌عنوان مثال استفاده کن.

۵) اگر کاربر «لیست کلمات سخت» خواست:
حداکثر ۵ کلمه را با شماره بیاور و روبروی هر کلمه معنی فارسی کوتاه بنویس.

سبک کلی:
- کوتاه، دقیق، مفید.
- بدون عنوان مارک‌داون (# یا **).
- بدون مقدمه («حتماً»، «بفرما»، «البته» و...). مستقیم به پاسخ بپرداز.
- اگر مطمئن نیستی، بگو نمی‌دانی؛ اختراع نکن.`,
  DICT: `You are a bilingual English–Persian dictionary for language learners. Always reply with STRICT JSON only — no markdown, no commentary, no code fences. The JSON must have exactly these keys:

{
  "word": string,                      // the headword, lowercase
  "phonetic": string,                  // IPA, e.g. "/hæpi/"
  "partOfSpeech": string,              // noun / verb / adjective / adverb / ...
  "definition": string,                // short English definition (≤12 words)
  "translation": string,               // concise Persian translation
  "example": string,                   // one short English sentence using the word
  "synonyms": string[],                // up to 5 real English synonyms (single words, not phrases). Empty array if none.
  "antonyms": string[],                // up to 5 real English antonyms. Empty array if none.
  "difficultyLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",  // CEFR level; if unsure pick "B1"
  "frequencyBand": "common" | "uncommon" | "rare",  // common = top-2000, uncommon = next-8000, rare = beyond
  "relatedWords": string[],            // up to 6 morphological family members (e.g. for "happy": happiness, unhappy, happily). Empty array if none.
  "etymology": string                  // short origin note (English or Persian, ≤1 line). Empty string "" if uncertain.
}

Rules:
- Never fabricate. If you don't know the etymology, return "".
- Synonyms/antonyms/related must be single English words.
- If the input is not a single word, still try your best; set partOfSpeech to "phrase" if needed.`,
  SUMMARIZE: `تو یک دستیار خلاصه‌سازی برای متن انگلیسی هستی. متن انگلیسی داده‌شده را در دقیقاً ۲ تا ۳ جمله به فارسی خلاصه می‌کنی. 

قوانین:
- فقط خلاصه را بنویس، بدون مقدمه، بدون عنوان، بدون مارک‌داون.
- جملات ساده و روان باشند.
- نام شخصیت‌ها و مکان‌های مهم را به فارسی برگردان.
- اگر متن خیلی کوتاه است، در یک جمله خلاصه کن.
- اگر متن نامفهوم یا خالی است، بنویس: «متنی برای خلاصه‌سازی موجود نیست.»`,
  TRANSLATE: `You are a precise English→Persian translator for language learners. Given an English sentence or paragraph, reply with STRICT JSON only — no markdown, no commentary, no code fences. The JSON must have exactly these keys:

{
  "translation": string,   // faithful, natural Persian translation of the input
  "notes": string          // ≤2 lines in Persian covering tense, idioms, or cultural context. Empty string "" if nothing notable.
}

Rules:
- Do not paraphrase; translate faithfully.
- Preserve the register (formal/casual) of the original.
- Notes are optional but helpful for a learner; keep them short.
- No preambles, no markdown.`,
} as const

/**
 * Defensive JSON extractor: strips markdown fences, finds the first `{` and
 * the matching last `}`, and parses only that slice. Returns `null` on failure.
 */
function extractJSON(text: string): unknown | null {
  if (!text) return null
  let t = text.trim()
  // Strip ```json ... ``` or ``` ... ``` fences.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) return null
  const slice = t.slice(first, last + 1)
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

/**
 * General chat completion. Returns the assistant text.
 * Falls back to '' if the AI service is unavailable or errors out.
 */
export async function aiChat(
  messages: ChatMessage[],
  opts: { temperature?: number } = {},
): Promise<string> {
  try {
    const client = await getClient()
    // The z-ai SDK's CreateChatCompletionBody accepts arbitrary additional
    // keys (its index signature is `[key: string]: any`), so `temperature`
    // is accepted at runtime. We cast through the inferred param type so the
    // `messages` field still gets type-checked.
    const res = await client.chat.completions.create({
      messages,
      temperature: opts.temperature ?? 0.6,
      stream: false,
    } as Parameters<typeof client.chat.completions.create>[0])
    const text =
      res?.choices?.[0]?.message?.content ??
      res?.choices?.[0]?.delta?.content ??
      (typeof res === 'string' ? res : '')
    return typeof text === 'string' ? text.trim() : ''
  } catch (err) {
    console.error('[ai] chat failed:', err)
    return ''
  }
}

/**
 * Bilingual dictionary: given an English word + sentence context, returns
 * a rich entry with phonetics, POS, definition, translation, example,
 * synonyms, antonyms, CEFR level, frequency band, related words, etymology.
 *
 * Returns `null` only if the upstream call fails entirely or JSON cannot be
 * parsed — never throws.
 */
export async function aiDictionary(
  word: string,
  context = '',
): Promise<DictionaryResult | null> {
  const user = `Word: "${word}"\nContext sentence: "${context || 'n/a'}"\nReturn the JSON now.`
  try {
    const text = await aiChat(
      [
        { role: 'system', content: SYSTEM_PROMPTS.DICT },
        { role: 'user', content: user },
      ],
      { temperature: 0.2 },
    )
    if (!text) return null
    const raw = extractJSON(text)
    if (!raw || typeof raw !== 'object') return null
    const j = raw as Record<string, unknown>
    return {
      word: String(j.word || word),
      phonetic: String(j.phonetic || ''),
      partOfSpeech: String(j.partOfSpeech || ''),
      definition: String(j.definition || ''),
      translation: String(j.translation || ''),
      example: String(j.example || ''),
      synonyms: toStringArray(j.synonyms),
      antonyms: toStringArray(j.antonyms),
      difficultyLevel: toDifficultyLevel(j.difficultyLevel),
      frequencyBand: toFrequencyBand(j.frequencyBand),
      relatedWords: toStringArray(j.relatedWords),
      etymology: String(j.etymology || ''),
    }
  } catch (err) {
    console.error('[ai] dictionary failed:', err)
    return null
  }
}

/**
 * Summarize an English passage into 2–3 Persian sentences.
 * Returns a fallback string on failure — never throws.
 */
export async function aiSummarize(
  text: string,
  _bookTitle?: string,
): Promise<string> {
  const clean = String(text || '').trim()
  if (!clean) return ''
  try {
    const out = await aiChat(
      [
        { role: 'system', content: SYSTEM_PROMPTS.SUMMARIZE },
        { role: 'user', content: clean.slice(0, 4000) },
      ],
      { temperature: 0.4 },
    )
    return out || ''
  } catch (err) {
    console.error('[ai] summarize failed:', err)
    return ''
  }
}

/**
 * Translate an English sentence/paragraph into Persian + short notes.
 * Returns a safe fallback object on failure — never throws.
 */
export async function aiTranslate(text: string): Promise<TranslateResult> {
  const clean = String(text || '').trim()
  if (!clean) return { translation: '', notes: '' }
  try {
    const out = await aiChat(
      [
        { role: 'system', content: SYSTEM_PROMPTS.TRANSLATE },
        { role: 'user', content: clean.slice(0, 2000) },
      ],
      { temperature: 0.3 },
    )
    if (!out) return { translation: '', notes: '' }
    const raw = extractJSON(out)
    if (!raw || typeof raw !== 'object') {
      // Model returned plain text instead of JSON — treat the whole thing as translation.
      return { translation: out, notes: '' }
    }
    const j = raw as Record<string, unknown>
    return {
      translation: String(j.translation || ''),
      notes: String(j.notes || ''),
    }
  } catch (err) {
    console.error('[ai] translate failed:', err)
    return { translation: '', notes: '' }
  }
}

// ---------- coercion helpers ----------

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0)
      .slice(0, 8)
  }
  if (typeof v === 'string' && v.trim()) {
    // Tolerate comma-separated strings.
    return v
      .split(/[,،]/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .slice(0, 8)
  }
  return []
}

const VALID_LEVELS: DifficultyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function toDifficultyLevel(v: unknown): DifficultyLevel {
  const u = String(v || '').toUpperCase().trim()
  return (VALID_LEVELS as string[]).includes(u) ? (u as DifficultyLevel) : 'B1'
}

const VALID_BANDS: FrequencyBand[] = ['common', 'uncommon', 'rare']

function toFrequencyBand(v: unknown): FrequencyBand {
  const u = String(v || '').toLowerCase().trim()
  return (VALID_BANDS as string[]).includes(u)
    ? (u as FrequencyBand)
    : 'uncommon'
}
