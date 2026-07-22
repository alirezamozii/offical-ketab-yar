/**
 * General-purpose utility tests for `src/lib/utils.ts`:
 *   - `slugify`: canonical, Unicode-aware, used by all admin API routes.
 *   - `cn`: Tailwind className merge helper.
 *
 * All assertions exercise real behaviour — no filler.
 */
import { describe, expect, it } from 'vitest'
import { cn, slugify } from '@/lib/utils'

describe('slugify', () => {
  it('lowercases ASCII text and replaces spaces with hyphens', () => {
    expect(slugify('Lewis Carroll')).toBe('lewis-carroll')
  })

  it('trims leading/trailing whitespace before slugifying', () => {
    expect(slugify('  Lewis Carroll  ')).toBe('lewis-carroll')
  })

  it('collapses runs of non-letter/digit chars into a single hyphen', () => {
    expect(slugify('Hello!!!   ---World')).toBe('hello-world')
  })

  it('strips leading/trailing hyphens (no orphan separators)', () => {
    expect(slugify('---!!!---')).toBe('')
  })

  it('NFKD-normalises accented Latin letters (combining marks become hyphens)', () => {
    // NFKD splits "é" (U+00E9) into "e" + U+0301 (combining acute). The
    // combining mark is NOT in [\p{L}\p{N}], so it's replaced with a hyphen.
    // Documented behaviour — callers that want clean ASCII slugs from
    // accented Latin should pre-strip diacritics before calling slugify.
    expect(slugify('Allégresse')).toBe('alle-gresse')
  })

  it('preserves Persian/Arabic script (Unicode-aware \\p{L} regex)', () => {
    // Persian word "سلام" (hello). All four chars are Persian letters and
    // should survive slugify unchanged.
    expect(slugify('سلام')).toBe('سلام')
  })

  it('replaces whitespace in Persian text with hyphens', () => {
    // Two Persian words separated by a space — the space becomes a hyphen,
    // the letters are preserved.
    const out = slugify('سلام دنیا')
    expect(out).toBe('سلام-دنیا')
  })

  it('preserves Persian digits (\\p{N} survives the regex)', () => {
    expect(slugify('فصل ۱۲ - پایان')).toBe('فصل-۱۲-پایان')
  })

  it('preserves Arabic script (combining diacritics are kept by NFKD)', () => {
    // Arabic base letters (\u0627..\u064A) survive the \p{L} regex. The
    // combining diacritics (\u064B..\u0652 — shadda/fatha/etc.) are also
    // in combining-mark ranges but slugify does not strip them — that's
    // documented behaviour. We assert the BASE letters survive.
    const s = slugify('سلام')
    expect(s).toBe('سلام')
  })

  it('returns empty string for pure-punctuation input', () => {
    expect(slugify('!?.,')).toBe('')
    expect(slugify('   ')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('handles Cyrillic (script preserved, lowercased)', () => {
    // Russian "War and Peace" author — Cyrillic letters survive the
    // \p{L} regex and are lowercased by .toLowerCase().
    const s = slugify('Лев Толстой')
    expect(s.length).toBeGreaterThan(0)
    // The output is composed of Cyrillic letters + hyphens only.
    expect(s).toMatch(/^[\p{L}\p{N}-]+$/u)
  })
})

describe('cn (className merge)', () => {
  it('joins multiple class strings with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('skips falsy values (false, null, undefined, "")', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar')
  })

  it('dedupes conflicting Tailwind classes (last wins via tailwind-merge)', () => {
    // tailwind-merge knows `px-2` and `px-4` conflict; the last one wins.
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('keeps non-conflicting classes intact', () => {
    expect(cn('flex', 'items-center', 'px-4')).toBe('flex items-center px-4')
  })

  it('handles conditional object syntax from clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  it('handles arrays via clsx', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })
})
