/**
 * JSON-LD Safe Serialization
 * --------------------------
 * Injecting JSON-LD via `dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}`
 * is an XSS vector: if any string field contains `</script>`, the attacker breaks
 * out of the `<script type="application/ld+json">` tag and executes arbitrary JS.
 *
 * This is especially dangerous when the JSON-LD includes user-generated content
 * (e.g. book review bodies, author names entered by admins).
 *
 * `safeJsonLd` runs `JSON.stringify` then escapes the two sequences that can
 * terminate a script element inside HTML:
 *   - `</`  → `<\/`  (closes the script tag)
 *   - `<!--` → `<\!--` (opens an HTML comment that can mask content / confuse parsers)
 *   - `<script` → `<\script` (defense in depth)
 *
 * The escaped output is still valid JSON (a JS string literal `"<\/"` is identical to
 * `"</"` at parse time), so search engines parse it correctly while browsers cannot
 * be tricked into executing it.
 *
 * @see https://owasp.org/www-community/attacks/xss/
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
