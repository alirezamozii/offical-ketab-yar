/**
 * Shared API request-validation helpers.
 *
 * The audit (14-testing-error-handling.md) found that only 1 of 47 API
 * routes used zod. The boilerplate cost of "parse body → safeParse →
 * return 400 with Persian error + field details" was the main reason —
 * this helper removes that cost.
 *
 * Usage:
 *   ```ts
 *   import { z } from 'zod'
 *   import { parseBody } from '@/lib/api-validate'
 *
 *   const Schema = z.object({
 *     bookSlug: z.string().min(1),
 *     currentPage: z.number().int().min(0),
 *   })
 *
 *   export async function POST(req: NextRequest) {
 *     const parsed = await parseBody(req, Schema)
 *     if (!parsed.ok) return parsed.response   // ← 400 already built
 *     const { bookSlug, currentPage } = parsed.data
 *     // ... route logic
 *   }
 *   ```
 *
 * On validation failure the helper returns a `NextResponse` with:
 *   • status 400
 *   • Content-Type: application/json; charset=utf-8
 *   • Cache-Control: no-store
 *   • body: { error: '<Persian message>', details: <zod flatten> }
 *
 * On JSON-parse failure (non-JSON body, malformed JSON) the same shape is
 * returned with a generic Persian "invalid JSON body" message — so callers
 * don't need to wrap `req.json()` in their own try/catch.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodType, ZodError } from 'zod'
import { apiValidationError } from './api-error'

export type ParsedBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

/**
 * Default Persian error message shown when the body fails zod validation.
 * Routes can override by passing `errorMessage`.
 */
const DEFAULT_VALIDATION_MESSAGE = 'ورودی نامعتبر است. لطفاً مقادیر را بررسی کنید.'

/**
 * Parse and validate a JSON request body against a zod schema.
 *
 * @param req            The Next.js request object.
 * @param schema         A zod schema (z.object({...}) etc.).
 * @param errorMessage   Optional custom Persian error message for the 400.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodType<T>,
  errorMessage: string = DEFAULT_VALIDATION_MESSAGE,
): Promise<ParsedBody<T>> {
  // ── Parse JSON body ────────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return {
      ok: false,
      response: apiValidationError('بدنه درخواست یک JSON معتبر نیست.', {
        body: 'invalid-json',
      }),
    }
  }

  // ── Validate against schema ────────────────────────────────────────────
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      response: apiValidationError(errorMessage, flattenZodError(result.error)),
    }
  }
  return { ok: true, data: result.data }
}

/**
 * Parse + validate URL search params against a zod schema.
 *
 * Use this for GET routes that accept filter/pagination params. The schema
 * should use `z.coerce.*` for query strings (which arrive as strings).
 *
 * @example
 *   const Schema = z.object({
 *     period: z.enum(['daily','weekly','monthly']).default('weekly'),
 *     limit: z.coerce.number().int().min(1).max(100).default(20),
 *   })
 */
export function parseQuery<T>(
  req: NextRequest,
  schema: ZodType<T>,
  errorMessage: string = DEFAULT_VALIDATION_MESSAGE,
): ParsedBody<T> {
  // Convert URLSearchParams → plain object for zod to chew on.
  const obj: Record<string, string | string[]> = {}
  req.nextUrl.searchParams.forEach((value, key) => {
    const existing = obj[key]
    if (existing === undefined) {
      obj[key] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      obj[key] = [existing, value]
    }
  })

  const result = schema.safeParse(obj)
  if (!result.success) {
    return {
      ok: false,
      response: apiValidationError(errorMessage, flattenZodError(result.error)),
    }
  }
  return { ok: true, data: result.data }
}

/**
 * Convert a zod error into a stable, JSON-serialisable shape.
 *
 *   {
 *     formErrors: string[],
 *     fieldErrors: { [field: string]: string[] }
 *   }
 *
 * This is the same shape `zod`'s own `.flatten()` produces, exposed here as
 * a function so we don't break if zod changes its internal class layout.
 */
function flattenZodError(err: ZodError): {
  formErrors: string[]
  fieldErrors: Record<string, string[]>
} {
  // Zod v4 renamed `flatten` slightly; call defensively.
  const flat =
    typeof (err as unknown as { flatten?: unknown }).flatten === 'function'
      ? (err as { flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> } }).flatten()
      : { formErrors: [], fieldErrors: {} }
  return {
    formErrors: flat.formErrors ?? [],
    fieldErrors: flat.fieldErrors ?? {},
  }
}
