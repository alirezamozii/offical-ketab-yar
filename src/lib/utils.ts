import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert an arbitrary string into a URL-safe lowercase-hyphen slug.
 *
 * Canonical home — previously duplicated (byte-for-byte) across ~9 admin API
 * route files plus the dead `slugifyAuthor` in `lib/data/index.ts`. Each
 * copy used the exact same pipeline; this centralises it so the algorithm
 * can't drift between callers.
 *
 * Persian / Arabic friendly: the Unicode-aware `[^\p{L}\p{N}]+` regex
 * preserves letters and digits from ALL scripts (Latin, Cyrillic, Arabic,
 * Persian, etc.) while collapsing whitespace + punctuation into single
 * hyphens. `NFKD` normalisation splits accented Latin letters (é → e)
 * before stripping — diacritics land in the discarded combining-mark
 * range and the base letter survives.
 *
 * @example
 *   slugify('Lewis Carroll')      // → 'lewis-carroll'
 *   slugify('Allégresse ①')       // → 'allegresse'
 *   slugify('  لوئیس کارول  ')    // → 'لوئیس-کارول'
 *   slugify('---!!!---')          // → '' (caller should fallback)
 */
export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

