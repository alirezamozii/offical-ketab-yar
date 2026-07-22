import { STORAGE_KEYS } from '@/lib/storage-keys'

const KEY = STORAGE_KEYS.progress

export type ProgressEntry = {
  currentPage: number
  totalPages: number
  percent: number
  ts: number
  /** Raw scroll % through the whole book (0–100). Optional — only the reader
   * writes this, so older entries from other call-sites won't have it. */
  scrollPercent?: number
  /** epoch ms of the most recent read activity (paragraph change OR scroll).
   * Used to sort "recently read" books. */
  lastReadAt?: number
}

export type ProgressMap = Record<string, ProgressEntry>

export function getLocalProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getLocalProgressFor(slug: string): ProgressEntry | undefined {
  return getLocalProgress()[slug]
}

/** Overwrite the progress entry for a book (replaces any existing entry). */
export function setLocalProgress(slug: string, entry: ProgressEntry) {
  if (typeof window === 'undefined') return
  const map = getLocalProgress()
  map[slug] = entry
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

/**
 * Merge a partial update into the existing progress entry for a book.
 *
 * Use this when you only want to update some fields (e.g. just `scrollPercent`
 * on scroll, or just `currentPage`/`percent` on paragraph change) without
 * losing fields written by a different code path. This is what makes it safe
 * to consolidate scroll-position saves and paragraph-change saves into a
 * single `ky_progress` map entry (replacing the old `ky_rs_{slug}` schema).
 */
export function mergeLocalProgress(
  slug: string,
  partial: Partial<ProgressEntry>,
) {
  if (typeof window === 'undefined') return
  const map = getLocalProgress()
  const prev = map[slug] ?? {
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    ts: 0,
  }
  map[slug] = { ...prev, ...partial }
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

export function clearLocalProgress(slug: string) {
  if (typeof window === 'undefined') return
  const map = getLocalProgress()
  delete map[slug]
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}
