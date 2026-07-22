/**
 * Shared date utility functions.
 */

export const DAY_MS = 86_400_000

/**
 * Returns YYYY-MM-DD local date string representation.
 */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const r = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${r}`
}
