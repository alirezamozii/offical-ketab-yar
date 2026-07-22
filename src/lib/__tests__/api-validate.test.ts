/**
 * API request-validation helper tests.
 *
 * Covers `src/lib/api-validate.ts`:
 *   - parseBody: parses + validates a JSON request body against a zod schema.
 *     On success returns `{ ok: true, data }`; on failure returns a NextResponse
 *     (status 400) with a Persian error message + zod-flattened details.
 *   - parseQuery: parses + validates URL search params against a zod schema
 *     (with `z.coerce.*` for query strings).
 *
 * All assertions exercise real behaviour — no filler.
 */
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, parseQuery } from '@/lib/api-validate'

// Helper: build a NextRequest with a JSON body.
function jsonReq(body: unknown, method = 'POST', url = 'http://localhost/api/test') {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Helper: build a NextRequest with query params (GET).
function getReq(query: string) {
  return new NextRequest(`http://localhost/api/test?${query}`, { method: 'GET' })
}

describe('parseBody — success path', () => {
  it('returns ok:true with typed data for a valid body', async () => {
    const Schema = z.object({
      bookSlug: z.string().min(1),
      currentPage: z.number().int().min(0),
    })
    const req = jsonReq({ bookSlug: 'alice', currentPage: 5 })
    const r = await parseBody(req, Schema)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.bookSlug).toBe('alice')
      expect(r.data.currentPage).toBe(5)
    }
  })

  it('applies zod transforms / defaults', async () => {
    const Schema = z.object({
      name: z.string().trim().default('anon'),
      age: z.coerce.number().default(0),
    })
    const req = jsonReq({ name: '  alice  ', age: '30' })
    const r = await parseBody(req, Schema)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.name).toBe('alice')
      expect(r.data.age).toBe(30)
    }
  })
})

describe('parseBody — failure path', () => {
  it('returns ok:false with a 400 response when fields are missing', async () => {
    const Schema = z.object({
      required: z.string().min(1),
    })
    const req = jsonReq({})
    const r = await parseBody(req, Schema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(400)
      const body = await r.response.json()
      expect(body.error).toBeTruthy()
      expect(body.details).toBeTruthy()
    }
  })

  it('returns ok:false with a 400 response when types are wrong', async () => {
    const Schema = z.object({
      n: z.number().int(),
    })
    const req = jsonReq({ n: 'not-a-number' })
    const r = await parseBody(req, Schema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(400)
      const body = await r.response.json()
      expect(body.details.fieldErrors).toBeDefined()
    }
  })

  it('returns ok:false when the body is not valid JSON', async () => {
    const Schema = z.object({ x: z.number() })
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json',
    })
    const r = await parseBody(req, Schema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(400)
      const body = await r.response.json()
      // Persian message about invalid JSON body.
      expect(body.details).toEqual({ body: 'invalid-json' })
    }
  })

  it('honours a custom error message override', async () => {
    const Schema = z.object({ x: z.number() })
    const req = jsonReq({})
    const r = await parseBody(req, Schema, 'پیام سفارشی')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      const body = await r.response.json()
      expect(body.error).toBe('پیام سفارشی')
    }
  })

  it('sets Cache-Control: no-store on the 400 response', async () => {
    const Schema = z.object({ x: z.number() })
    const req = jsonReq({})
    const r = await parseBody(req, Schema)
    if (!r.ok) {
      expect(r.response.headers.get('cache-control')).toBe('no-store')
    }
  })

  it('sets Content-Type with UTF-8 charset (Persian text needs it)', async () => {
    const Schema = z.object({ x: z.number() })
    const req = jsonReq({})
    const r = await parseBody(req, Schema)
    if (!r.ok) {
      const ct = r.response.headers.get('content-type')
      expect(ct).toContain('application/json')
      expect(ct).toContain('charset=utf-8')
    }
  })
})

describe('parseQuery — success path', () => {
  it('parses + validates query string params', () => {
    const Schema = z.object({
      period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    const req = getReq('period=daily&limit=50')
    const r = parseQuery(req, Schema)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.period).toBe('daily')
      expect(r.data.limit).toBe(50)
    }
  })

  it('applies defaults when params are missing', () => {
    const Schema = z.object({
      limit: z.coerce.number().int().default(10),
    })
    const req = getReq('')
    const r = parseQuery(req, Schema)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.limit).toBe(10)
    }
  })
})

describe('parseQuery — failure path', () => {
  it('returns ok:false when an enum value is invalid', () => {
    const Schema = z.object({
      period: z.enum(['daily', 'weekly']),
    })
    const req = getReq('period=hourly')
    const r = parseQuery(req, Schema)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.response.status).toBe(400)
    }
  })

  it('returns ok:false when a coerced number is out of range', () => {
    const Schema = z.object({
      limit: z.coerce.number().int().max(100),
    })
    const req = getReq('limit=500')
    const r = parseQuery(req, Schema)
    expect(r.ok).toBe(false)
  })
})
