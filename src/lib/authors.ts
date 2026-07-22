/**
 * src/lib/authors.ts — types + UI constants for the author directory.
 *
 * Spiritual successor to `src/lib/the legacy authors module`. The 24-entry
 * `AUTHOR_BIOS` hardcoded map has moved to the `Author` Prisma model
 * (seeded from `prisma/seed-content.ts`, editable via `/admin/authors`).
 * Runtime consumers should fetch author bios from the `Author` DB rows
 * directly — `getAuthors()` in `src/lib/data/index.ts` already joins the
 * CMS-managed bio fields onto each `AuthorSummary` via `Object.assign`.
 *
 * What remains here:
 *   • The TypeScript types (`AuthorBio`, `AuthorEra`).
 *   • The `AUTHOR_ERAS` UI constant (filter-chip labels — Persian +
 *     English, drives the directory page's filter row).
 *
 * The legacy `getAuthorBio(name)` / `listAuthorBios()` helpers are GONE —
 * they were thin wrappers around the hardcoded `AUTHOR_BIOS` map. Server
 * consumers should call `getAuthors()` and read the bio fields directly
 * from each row.
 */

export type AuthorEra =
  | 'Augustan'
  | 'Romantic'
  | 'Victorian'
  | 'Edwardian'
  | 'Modern'
  | 'Postmodern'

export interface AuthorBio {
  /** English name — must match the `Book.author` string exactly. */
  name: string
  /** Persian transliteration of the author's name. */
  nameFa: string
  /** 2–3 sentence English biography. */
  bio: string
  /** 2–3 sentence Persian biography. */
  bioFa: string
  /** Birth year (CE). `null` only if unknown — every curated entry has one. */
  birthYear: number
  /** Death year (CE). `null` for living authors. */
  deathYear: number | null
  /** English nationality adjective (e.g. "British"). */
  nationality: string
  /** Persian nationality adjective (e.g. "بریتانیایی"). */
  nationalityFa: string
  /** ISO-2 country code → flag emoji, used as a visual hint in the card. */
  flagEmoji: string
  /** 2–3 of the author's best-known works (English titles). */
  notableWorks: string[]
  /** Literary era (English label). */
  era: AuthorEra
  /** Persian equivalent of `era`. */
  eraFa: string
}

/**
 * Era ordering used to drive the filter-chip row on the directory page.
 * The first entry ("همه" / All) is appended by the caller — this list
 * only contains real eras, in chronological order.
 */
export const AUTHOR_ERAS: { value: AuthorEra; labelFa: string; labelEn: string }[] = [
  { value: 'Augustan', labelFa: 'اَگوستانی', labelEn: 'Augustan' },
  { value: 'Romantic', labelFa: 'رمانتیک', labelEn: 'Romantic' },
  { value: 'Victorian', labelFa: 'ویکتوریایی', labelEn: 'Victorian' },
  { value: 'Edwardian', labelFa: 'ادواردی', labelEn: 'Edwardian' },
  { value: 'Modern', labelFa: 'مدرن', labelEn: 'Modern' },
  { value: 'Postmodern', labelFa: 'پست‌مدرن', labelEn: 'Postmodern' },
]
