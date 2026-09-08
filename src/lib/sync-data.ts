import type { ProgressMap } from '@/hooks/reader/use-local-progress'

export interface ServerProgress {
  bookSlug: string
  currentPage: number
  percent: number
  lastReadAt: string
}

/** API pages are one-based; the reader stores a zero-based paragraph index. */
export function mergeServerProgress(local: ProgressMap, rows: ServerProgress[]): ProgressMap {
  const result = { ...local }
  for (const row of rows) {
    const timestamp = Date.parse(row.lastReadAt)
    if (!Number.isFinite(timestamp) || !Number.isFinite(row.currentPage)) continue
    const existing = result[row.bookSlug]
    if (existing && (existing.lastReadAt ?? existing.ts) > timestamp) continue
    result[row.bookSlug] = {
      currentPage: Math.max(0, row.currentPage - 1),
      totalPages: existing?.totalPages ?? 0,
      percent: row.percent,
      ts: timestamp,
      lastReadAt: timestamp,
    }
  }
  return result
}

export function parseStoredArray<T>(value: string | T[]): T[] {
  if (Array.isArray(value)) return value
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}
