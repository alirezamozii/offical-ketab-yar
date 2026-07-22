/**
 * src/lib/xp-events.ts
 * ---------------------------------------------------------------
 * Shared client-side XP event bus.
 *
 * Replaces the previous fragile pattern where four components
 * (use-achievements, xp-bar, daily-challenges, level-up-celebration)
 * each monkey-patched `window.fetch` to intercept POST /api/xp
 * responses. Sibling-unmount ordering could silently break the
 * patching chain and stop games-played / level-up detection.
 *
 * New pattern:
 *   1. Callers POST to /api/xp via `postXP(body)` instead of `fetch`.
 *   2. `postXP` parses the response and dispatches a single
 *      `ky-xp-update` CustomEvent on `window`.
 *   3. Consuming components subscribe via `onXPUpdate(callback)`.
 *
 * Client-only — uses `window`/`CustomEvent`, so callers must be
 * in Client Components or guard with `typeof window !== 'undefined'`.
 * ---------------------------------------------------------------
 */

/** Shape of the POST body accepted by /api/xp. */
export interface XPPostBody {
  pagesRead?: number
  completedBook?: boolean
  bookLevel?: string
  isFirstReadToday?: boolean
  vocabGameXP?: number
}

/**
 * Subset of the /api/xp POST response that subscribers may need.
 * Kept loose (everything optional) so the type stays compatible
 * with the API's defensive fallbacks (e.g. DB unavailable).
 */
export interface XPPostResponse {
  totalXP?: number
  level?: number
  newLevel?: number
  levelTitle?: string
  leveledUp?: boolean
  progressPercentage?: number
  xpForNextLevel?: number
  pagesRead?: number
  booksCompleted?: number
  streakDays?: number
  gained?: {
    baseXP?: number
    streakBonus?: number
    completionBonus?: number
    difficultyBonus?: number
    firstReadBonus?: number
    totalXP?: number
    bonusMultiplier?: number
  }
}

/** Payload delivered to subscribers via the `ky-xp-update` event. */
export interface XPUpdateEvent {
  /** The request body that was POSTed to /api/xp. */
  body: XPPostBody
  /** The parsed response body (empty object on parse failure). */
  response: XPPostResponse
}

const EVENT_NAME = 'ky-xp-update'

/**
 * Dispatch a `ky-xp-update` CustomEvent on `window` carrying the
 * request body + parsed response. Safe to call from server code
 * (no-ops when `window` is undefined).
 */
export function notifyXPUpdate(data: XPUpdateEvent): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }))
  } catch {
    // Some test/sandbox environments lack CustomEvent. Fail silently —
    // observation must never break the calling code path.
  }
}

/**
 * Subscribe to XP-update events. Returns an unsubscribe function.
 * No-ops (and returns a no-op unsubscribe) when `window` is undefined,
 * so it is safe to call from a top-level React effect on first render.
 */
export function onXPUpdate(
  callback: (data: XPUpdateEvent) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const ce = e as CustomEvent<XPUpdateEvent>
    if (ce && ce.detail) {
      try {
        callback(ce.detail)
      } catch {
        // Subscriber errors must never break other subscribers or
        // the dispatching code path.
      }
    }
  }
  window.addEventListener(EVENT_NAME, handler as EventListener)
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener)
}

/**
 * POST to /api/xp and — on a 2xx response — dispatch a `ky-xp-update`
 * event carrying the request body + parsed response so subscribers
 * (XP bar, daily challenges, level-up celebration, achievements) can
 * react. Always returns the original Response so callers can read it
 * themselves if needed.
 *
 * Replaces the previous `fetch('/api/xp', { method: 'POST', ... })`
 * calls scattered across reader + vocab + dashboard code.
 */
export async function postXP(body: XPPostBody): Promise<Response> {
  const res = await fetch('/api/xp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.ok) {
    try {
      // Clone so the caller can still read the body if it wants to.
      const clone = res.clone()
      const response = (await clone.json().catch(() => ({}))) as XPPostResponse
      notifyXPUpdate({ body, response })
    } catch {
      // never let observation break the caller
    }
  }
  return res
}
