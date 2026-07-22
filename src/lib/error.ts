/**
 * Shared unknown-error → string helpers.
 *
 * Catch blocks must use `catch (e: unknown)` (the default in TS 4.4+) — this
 * module gives every call-site a single, consistent way to extract a
 * human-readable message from an unknown thrown value, mirroring the old
 * `e?.message || fallback` pattern without ever using `any`.
 */

/**
 * Extract a best-effort message from a thrown value of unknown shape.
 *
 * Accepts:
 *  - `Error` / `Error`-like objects with a `string` `message` property
 *  - plain strings (used as-is)
 *  - objects with a `string` `message` field (e.g. Prisma errors)
 *  - anything else (stringified)
 *
 * Returns the supplied `fallback` when the extracted message is empty.
 */
export function errorMessage(e: unknown, fallback = ''): string {
  if (typeof e === 'string') return e || fallback
  if (e instanceof Error) return e.message || fallback
  if (e !== null && typeof e === 'object' && 'message' in e) {
    const m = (e as { message: unknown }).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  if (e === undefined || e === null) return fallback
  try {
    const s = String(e)
    return s === '[object Object]' ? fallback : s || fallback
  } catch {
    return fallback
  }
}
