/**
 * Shared types and helpers for the vocabulary mini-games
 * (match / listen / spell). Extracted here so each game file only
 * keeps its game-specific logic.
 */

export interface VocabWord {
  id: string
  word: string
  translation: string
  definition: string
  /** Optional context sentence captured from a book. */
  context?: string
  /** Optional slug of the book the word came from. */
  bookSlug?: string
  /** Optional ISO date the word was saved. */
  createdAt?: string
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Normalize a typed/expected answer for forgiving comparison. */
export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}']/gu, '')
}

/** Compact Persian time formatter for the countdown timer. */
export function fmtTime(s: number): string {
  if (s < 60) return `${s}ث`
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export type DiffStatus = 'ok' | 'missing' | 'extra'

export interface DiffChar {
  ch: string
  status: DiffStatus
}

/**
 * Char-level diff used by the spell game to visualize how the user's
 * typed answer differs from the correct word.
 */
export function diffChars(target: string, userInput: string): DiffChar[] {
  const t = target.toLowerCase()
  const u = userInput.toLowerCase()
  const out: DiffChar[] = []
  let i = 0
  let j = 0
  while (i < t.length && j < u.length) {
    if (t[i] === u[j]) {
      out.push({ ch: t[i], status: 'ok' })
      i++
      j++
    } else {
      // try to find u[j] later in t (skip in target = missing target char)
      const next = t.indexOf(u[j], i + 1)
      if (next !== -1 && next - i <= 3) {
        for (let k = i; k < next; k++) out.push({ ch: t[k], status: 'missing' })
        i = next
      } else {
        // extra char in user input
        out.push({ ch: u[j], status: 'extra' })
        j++
      }
    }
  }
  while (i < t.length) {
    out.push({ ch: t[i], status: 'missing' })
    i++
  }
  while (j < u.length) {
    out.push({ ch: u[j], status: 'extra' })
    j++
  }
  return out
}
