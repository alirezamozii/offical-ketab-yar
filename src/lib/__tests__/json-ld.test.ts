/**
 * JSON-LD safe-serialisation tests.
 *
 * `safeJsonLd` is the XSS-prevention helper for `<script type="application/ld+json">`
 * blocks. Injecting raw `JSON.stringify(obj)` is a known XSS vector: any string
 * field containing `</script>` breaks out of the script element and executes
 * arbitrary JS. This test file proves the helper neutralises every known
 * escape vector.
 *
 * Critical assertion: the XSS payload `"</script><script>alert(1)</script>"`
 * must NOT produce a literal `</script>` sequence in the output.
 *
 * All assertions exercise real behaviour — no filler.
 */
import { describe, expect, it } from 'vitest'
import { safeJsonLd } from '@/lib/json-ld'

describe('safeJsonLd', () => {
  it('serialises a plain object as JSON', () => {
    const out = safeJsonLd({ name: 'book', pages: 10 })
    expect(JSON.parse(out)).toEqual({ name: 'book', pages: 10 })
  })

  it('escapes "<" as \\u003c (prevents closing-tag break-out)', () => {
    const out = safeJsonLd({ s: '<' })
    expect(out).toContain('\\u003c')
    expect(out).not.toMatch(/[^\\]</) // no unescaped literal "<"
  })

  it('escapes ">" as \\u003e', () => {
    const out = safeJsonLd({ s: '>' })
    expect(out).toContain('\\u003e')
    expect(out).not.toMatch(/[^\\]>/) // no unescaped literal ">"
  })

  it('escapes "&" as \\u0026 (prevents HTML-entity confusion)', () => {
    const out = safeJsonLd({ s: '&amp;' })
    expect(out).toContain('\\u0026')
    expect(out).not.toMatch(/[^\\]&/) // no unescaped literal "&"
  })

  it('CRITICAL: neutralises the canonical XSS payload', () => {
    // The classic JSON-LD XSS attack: a string field that, when serialised
    // naively, contains `</script>` — closing the script element and letting
    // the rest execute as HTML.
    const payload = '</script><script>alert(1)</script>'
    const out = safeJsonLd({ description: payload })
    // 1. The literal substring `</script>` must NOT appear anywhere in the
    //    escaped output. The `<` and `/` get separated by the `\u003c` escape.
    expect(out).not.toContain('</script>')
    // 2. The output is still valid JSON — round-trip the parse to confirm
    //    the original string is recoverable.
    expect(JSON.parse(out).description).toBe(payload)
  })

  it('escapes U+2028 (LINE SEPARATOR) — breaks JS parsers but is valid JSON', () => {
    const out = safeJsonLd({ s: 'a\u2028b' })
    expect(out).toContain('\\u2028')
    // The escaped form is still valid JSON, so JSON.parse recovers the original.
    expect(JSON.parse(out).s).toBe('a\u2028b')
  })

  it('escapes U+2029 (PARAGRAPH SEPARATOR)', () => {
    const out = safeJsonLd({ s: 'a\u2029b' })
    expect(out).toContain('\\u2029')
    expect(JSON.parse(out).s).toBe('a\u2029b')
  })

  it('handles nested objects with attacker-controlled strings', () => {
    const obj = {
      author: { name: '</script><img src=x onerror=alert(1)>' },
      reviews: [{ body: '<script>evil()</script>' }],
    }
    const out = safeJsonLd(obj)
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('<img')
    // Round-trip preserves data integrity.
    expect(JSON.parse(out)).toEqual(obj)
  })

  it('handles arrays at the top level', () => {
    const out = safeJsonLd([1, 'two', { three: 3 }])
    expect(JSON.parse(out)).toEqual([1, 'two', { three: 3 }])
  })

  it('handles null values (JSON convention)', () => {
    expect(JSON.parse(safeJsonLd(null))).toBeNull()
  })

  it('preserves non-ASCII Persian text without escaping', () => {
    // Persian text should pass through unchanged (it's not an XSS vector).
    const out = safeJsonLd({ title: 'سلام دنیا' })
    expect(out).toContain('سلام دنیا')
  })
})
