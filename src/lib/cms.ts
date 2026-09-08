/**
 * src/lib/cms.ts — DB-backed fetchers for the dynamic CMS models.
 *
 * Replaces the hardcoded `src/lib/*-data.ts` arrays with Prisma queries.
 * The legacy data files have been DELETED — types + UI constants live in
 * `src/lib/<name>.ts` (e.g. `src/lib/quotes.ts`, `src/lib/achievements.ts`)
 * and the actual content rows live in the DB (seeded via
 * `prisma/seed-content.ts`, editable via the admin CMS).
 *
 * Each fetcher:
 *   • Orders by `displayOrder` ASC so the admin's curated order is respected.
 *   • Filters `isActive: true` by default (admins can soft-hide a row).
 *   • Returns the same shape the legacy arrays had, so consumers can swap
 *     `import { CURATED_QUOTES } from '@/lib/quotes'` (types-only) for
 *     `import { getActiveQuotes } from '@/lib/cms'` (DB rows) with minimal
 *     churn.
 */

import { cache } from 'react'
import { db, safeQuery } from '@/lib/db'
import type {
  CuratedQuote,
  QuoteTheme,
  QuoteLength,
} from '@/lib/quotes'
import type {
  AchievementDef,
  AchievementRarity,
  AchievementCategory,
} from '@/lib/achievements'
import type {
  GoalsConfig,
  MilestoneDef,
  GoalUnit,
} from '@/lib/goals'
import type { AuthorBio, AuthorEra } from '@/lib/authors'

// ─────────────────────────────────────────────────────────────────────────────
// Quotes
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a Quote row's `themes` JSON string into a typed array. */
function parseThemes(raw: string): QuoteTheme[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String) as QuoteTheme[]
  } catch {
    /* ignore */
  }
  return []
}

/** Convert a DB `Quote` row into the legacy `CuratedQuote` shape. */
export function dbQuoteToLegacy(q: {
  slug: string
  text: string
  textFa: string
  bookSlug: string
  bookTitle: string
  bookAuthor: string
  pageNumber: number
  themes: string
  length: string
}): CuratedQuote {
  return {
    id: q.slug,
    text: q.text,
    textFa: q.textFa,
    bookSlug: q.bookSlug,
    bookTitle: q.bookTitle,
    bookAuthor: q.bookAuthor,
    pageNumber: q.pageNumber,
    theme: parseThemes(q.themes),
    length: (q.length as QuoteLength) || 'متوسط',
  }
}

export const SEED_QUOTES: CuratedQuote[] = [
  {
    id: 'alice-curiouser',
    text: 'Curiouser and curiouser! cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English).',
    textFa: 'عجیب‌تر و غریب‌تر! آلیس فریاد زد (چنان غافلگیر شده بود که در آن لحظه کلاً فراموش کرد چگونه انگلیسی سلیس صحبت کند).',
    bookSlug: 'alice-in-wonderland',
    bookTitle: "Alice's Adventures in Wonderland",
    bookAuthor: 'Lewis Carroll',
    pageNumber: 2,
    theme: ['ماجراجویی', 'خیال'],
    length: 'متوسط',
  },
  {
    id: 'pride-prejudice-truth',
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    textFa: 'این حقیقتی است که در سرتاسر جهان پذیرفته شده است، که مرد مجرد صاحب ثروت خوب، حتماً نیازمند همسری است.',
    bookSlug: 'pride-and-prejudice',
    bookTitle: 'Pride and Prejudice',
    bookAuthor: 'Jane Austen',
    pageNumber: 1,
    theme: ['عشق', 'حکمت'],
    length: 'متوسط',
  },
  {
    id: 'little-prince-heart',
    text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
    textFa: 'تنها با چشم دل می‌توان خوب دید؛ آنچه اصل است و ضروری، از چشم پنهان است.',
    bookSlug: 'the-little-prince',
    bookTitle: 'The Little Prince',
    bookAuthor: 'Antoine de Saint-Exupéry',
    pageNumber: 4,
    theme: ['حکمت', 'دوستی', 'رشد شخصی'],
    length: 'کوتاه',
  },
  {
    id: 'great-gatsby-boats',
    text: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    textFa: 'پس پارو می‌زنیم، همچون قایق‌هایی برخلاف جهت جریان آب، که بی‌وقفه به سوی گذشته بازگردانده می‌شویم.',
    bookSlug: 'the-great-gatsby',
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    pageNumber: 5,
    theme: ['زمان', 'حکمت'],
    length: 'کوتاه',
  },
  {
    id: 'christmas-carol-burden',
    text: 'No one is useless in this world who lightens the burdens of another.',
    textFa: 'هیچ‌کس در این جهان بی‌فایده نیست اگر اندکی از بار سنگین دوش دیگری بکاهد.',
    bookSlug: 'a-christmas-carol',
    bookTitle: 'A Christmas Carol',
    bookAuthor: 'Charles Dickens',
    pageNumber: 3,
    theme: ['خوش‌بینی', 'رشد شخصی', 'حکمت'],
    length: 'کوتاه',
  },
  {
    id: 'sherlock-impossible',
    text: 'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    textFa: 'وقتی تمام ناممکن‌ها را کنار زدی، هر آنچه باقی می‌ماند، هرچقدر هم دور از ذهن باشد، باید حقیقت باشد.',
    bookSlug: 'the-adventures-of-sherlock-holmes',
    bookTitle: 'The Adventures of Sherlock Holmes',
    bookAuthor: 'Arthur Conan Doyle',
    pageNumber: 2,
    theme: ['حکمت', 'ماجراجویی'],
    length: 'متوسط',
  },
]

/** Fetch all active quotes, ordered by `displayOrder`. */
export const getActiveQuotes = cache(async function getActiveQuotes(): Promise<CuratedQuote[]> {
  try {
    const rows = await safeQuery(
      () =>
        db.quote.findMany({
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        }),
      [],
      250,
    )
    if (rows && rows.length > 0) {
      return rows.map(dbQuoteToLegacy)
    }
  } catch {
    console.warn('[getActiveQuotes] DB offline or query skipped.')
  }
  return SEED_QUOTES
})

/** Fetch all quotes (including inactive) — admin panel use. */
export async function getAllQuotes() {
  return db.quote.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

/** Fetch a single quote by slug. */
export async function getQuoteBySlug(slug: string) {
  return db.quote.findUnique({ where: { slug } })
}

/** Quote-of-the-day — deterministic by local date. */
export async function getQuoteOfTheDayFromDB(date: Date = new Date()): Promise<CuratedQuote | null> {
  try {
    const all = await getActiveQuotes()
    if (all.length === 0) return SEED_QUOTES[0]
    const s = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return all[Math.abs(h) % all.length]
  } catch {
    console.warn('[getQuoteOfTheDayFromDB] DB offline or query skipped.')
    return SEED_QUOTES[0]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a DB `AchievementDef` row into the legacy shape. */
export function dbAchievementToLegacy(a: {
  slug: string
  title: string
  description: string
  icon: string
  color: string
  rarity: string
  category: string
  xpReward: number
  maxProgress: number
  unit: string
}): AchievementDef {
  return {
    id: a.slug,
    title: a.title,
    description: a.description,
    icon: a.icon,
    color: a.color,
    rarity: a.rarity as AchievementRarity,
    category: a.category as AchievementCategory,
    xpReward: a.xpReward,
    maxProgress: a.maxProgress,
    unit: a.unit,
  }
}

/** Fetch all active achievement defs. */
export async function getActiveAchievementDefs(): Promise<AchievementDef[]> {
  const rows = await db.achievementDef.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(dbAchievementToLegacy)
}

// ─────────────────────────────────────────────────────────────────────────────
// Goals + Milestones
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the periodic goals (daily/weekly/monthly) as a `GoalsConfig`. */
export async function getGoalsConfigFromDB(): Promise<GoalsConfig> {
  const rows = await db.goalDef.findMany({
    where: { period: { in: ['daily', 'weekly', 'monthly'] }, isActive: true },
  })
  const out: GoalsConfig = {
    daily: { target: 10, unit: 'pages' },
    weekly: { target: 70, unit: 'pages' },
    monthly: { target: 300, unit: 'pages' },
  }
  for (const r of rows) {
    if (r.period === 'daily' || r.period === 'weekly' || r.period === 'monthly') {
      out[r.period] = {
        target: r.target,
        unit: (r.unit as GoalUnit) || 'pages',
      }
    }
  }
  return out
}

/** Convert a DB `GoalDef` row (milestone kind) into the legacy `MilestoneDef` shape. */
export function dbMilestoneToLegacy(g: {
  slug: string
  title: string
  description: string
  icon: string
  target: number
  kind: string
}): MilestoneDef {
  return {
    id: g.slug,
    title: g.title,
    description: g.description,
    icon: g.icon,
    kind: g.kind as MilestoneDef['kind'],
    target: g.target,
  }
}

/** Fetch all active milestone defs (GoalDef rows with non-empty `kind`). */
export async function getActiveMilestoneDefs(): Promise<MilestoneDef[]> {
  const rows = await db.goalDef.findMany({
    where: { kind: { not: '' }, isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(dbMilestoneToLegacy)
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single setting's JSON value, or `null` if the key doesn't exist.
 * Caller is responsible for typing the return (the DB stores opaque JSON).
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const row = await db.settingDef.findUnique({ where: { key } })
  if (!row) return null
  try {
    return JSON.parse(row.value) as T
  } catch {
    return null
  }
}

/** Fetch every setting in a category. */
export async function getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
  const rows = await db.settingDef.findMany({ where: { category } })
  const out: Record<string, unknown> = {}
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value)
    } catch {
      out[r.key] = null
    }
  }
  return out
}

/** Upsert a setting (admin write path). */
export async function upsertSetting(opts: {
  key: string
  value: unknown
  category?: string
  description?: string
}) {
  return db.settingDef.upsert({
    where: { key: opts.key },
    update: {
      value: JSON.stringify(opts.value),
      ...(opts.description ? { description: opts.description } : {}),
    },
    create: {
      key: opts.key,
      value: JSON.stringify(opts.value),
      category: opts.category || 'general',
      description: opts.description || '',
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Authors (bio directory)
// ─────────────────────────────────────────────────────────────────────────────
//
// `getAuthors()` in `src/lib/data/index.ts` already joins the CMS-managed
// bio fields onto each `AuthorSummary` via `Object.assign`. The helper below
// builds a typed `AuthorBio` from those attached fields, returning `null`
// when the row has no bio data (so the UI can render a graceful fallback
// card with name + books only).
//
// This replaces the legacy `getAuthorBio(name)` helper in
// `src/lib/the legacy authors module` which read from a hardcoded `AUTHOR_BIOS` map.
// The DB is now the single source of truth.

/**
 * Build a typed `AuthorBio` from the bio fields attached to an `AuthorSummary`
 * (or any Author-like row). Returns `null` when the row has no bio data.
 */
export function buildAuthorBio(author: {
  name: string
  nameFa?: string | null
  bio?: string | null
  bioFa?: string | null
  birthYear?: number | null
  deathYear?: number | null
  nationality?: string | null
  nationalityFa?: string | null
  flagEmoji?: string | null
  notableWorks?: string[] | string | null
  era?: string | null
  eraFa?: string | null
  biography?: string | null
  biographyFa?: string | null
  tags?: string[] | string | null
  website?: string | null
  wikipedia?: string | null
}): AuthorBio | null {
  // No bio data → signal the caller to render a fallback card.
  if (!author.bio && !author.bioFa && !author.nameFa) return null

  // `notableWorks` may be a JSON string (DB raw) or already-parsed array
  // (post-`getAuthors()` Object.assign).
  let notableWorks: string[] = []
  const raw = author.notableWorks
  if (Array.isArray(raw)) {
    notableWorks = raw.map(String)
  } else if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) notableWorks = parsed.map(String)
    } catch {
      /* ignore */
    }
  }

  // Parse tags the same way as notableWorks
  let tags: string[] = []
  const rawTags = author.tags
  if (Array.isArray(rawTags)) {
    tags = rawTags.map(String)
  } else if (typeof rawTags === 'string' && rawTags.length > 0) {
    try {
      const parsed = JSON.parse(rawTags)
      if (Array.isArray(parsed)) tags = parsed.map(String)
    } catch {
      /* ignore */
    }
  }

  return {
    name: author.name,
    nameFa: author.nameFa || '',
    bio: author.bio || '',
    bioFa: author.bioFa || '',
    birthYear: author.birthYear ?? 0,
    deathYear: author.deathYear ?? null,
    nationality: author.nationality || '',
    nationalityFa: author.nationalityFa || '',
    flagEmoji: author.flagEmoji || '',
    notableWorks,
    era: (author.era || 'Modern') as AuthorEra,
    eraFa: author.eraFa || '',
    biography: author.biography || '',
    biographyFa: author.biographyFa || '',
    tags,
    website: author.website || '',
    wikipedia: author.wikipedia || '',
  }
}
