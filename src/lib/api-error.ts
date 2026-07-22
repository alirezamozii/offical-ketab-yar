/**
 * Standardised API error helper.
 *
 * Every API route in this repo should return errors with a consistent JSON
 * shape so the client can rely on it:
 *
 *   { error: string, details?: unknown }
 *
 * `error` is always a Persian (or sometimes English for admin routes)
 * user-facing message. `details` is optional and carries structured
 * context — typically a zod `error.flatten()` payload for 400s, or an
 * internal hint for 500s (never sensitive data).
 *
 * The response always carries `Content-Type: application/json; charset=utf-8`
 * because Persian text needs UTF-8 — without the explicit charset some
 * proxies/browsers fall back to Latin-1 and mangle the message.
 */

import { NextResponse } from 'next/server'

export interface ApiErrorOptions {
  /** Optional extra headers (e.g. `{ 'Cache-Control': 'no-store' }`). */
  headers?: Record<string, string>
}

/**
 * Build a standardised JSON error response.
 *
 * @param message  Persian/English error message shown to the user.
 * @param status   HTTP status code (400, 401, 403, 404, 409, 429, 500…).
 * @param details  Optional structured details (zod issues, field info…).
 * @param options  Optional extra headers.
 */
export function apiError(
  message: string,
  status: number,
  details?: unknown,
  options?: ApiErrorOptions,
): NextResponse {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(options?.headers ?? {}),
      },
    },
  )
}

/**
 * 400 Bad Request — used for zod validation failures.
 *
 * Always sets `Cache-Control: no-store` so an error response is never
 * cached by a CDN/proxy (it would leak a stale "invalid" response to the
 * next user who sends a valid body).
 */
export function apiValidationError(
  message: string,
  details: unknown,
): NextResponse {
  return apiError(message, 400, details, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
