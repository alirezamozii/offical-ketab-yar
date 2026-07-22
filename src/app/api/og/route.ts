import sharp from 'sharp'
import { NextResponse } from 'next/server'
import { SITE } from '@/lib/site'

/**
 * Dynamic Open Graph image generator for ketab-yar.
 *
 * Returns a 1200x630 PNG branded with the ketab-yar gold-on-dark theme.
 * Accepts `?title=...&subtitle=...` query params so each page can request a
 * unique OG image. Falls back to the brand defaults when no params given.
 *
 * Notes:
 *  - Uses sharp (already a dependency) to compose an SVG and rasterise it to
 *    PNG. SVG <text> does NOT shape complex scripts (Persian/Farsi), so we
 *    intentionally render only Latin-script text on the image. The actual
 *    Persian context lives in the page's <title>/<meta description>.
 *  - Output is cached for 24h (Cache-Control + s-maxage) so repeated crawls
 *    do not re-rasterise.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WIDTH = 1200
const HEIGHT = 630

const BRAND_TITLE = 'Ketab-Yar'
const BRAND_SUBTITLE = 'Bilingual English books with AI'
// Display-only host (no protocol) shown on the OG image — derived from the
// central SITE config so staging / preview deploys brand correctly.
const BRAND_URL = new URL(SITE.url).host

// Clamp helpers so a malicious or accidental long query does not blow up the
// layout. Titles are truncated to ~60 chars (typical OG title limit).
function clamp(s: string, max: number): string {
  const t = (s || '').trim().slice(0, max)
  return t.length >= max ? t.slice(0, max - 1) + '\u2026' : t
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return c
    }
  })
}

/**
 * Compute a font-size that fits `text` into `maxWidth` given the font stack
 * and starting size. Steps down by 4px until it fits or hits minSize.
 */
function fitFontSize(
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
): number {
  // Rough estimate: average Latin glyph is ~0.55em wide for bold sans-serif.
  const charWidthRatio = 0.55
  for (let size = startSize; size >= minSize; size -= 4) {
    const estWidth = text.length * size * charWidthRatio
    if (estWidth <= maxWidth) return size
  }
  return minSize
}

function buildSvg(title: string, subtitle: string): string {
  const safeTitle = escapeXml(clamp(title || BRAND_TITLE, 60))
  const safeSubtitle = escapeXml(clamp(subtitle || BRAND_SUBTITLE, 80))
  const titleSize = fitFontSize(safeTitle, WIDTH - 160, 76, 44)
  const subtitleSize = fitFontSize(safeSubtitle, WIDTH - 160, 40, 24)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1612"/>
      <stop offset="50%" stop-color="#2a2218"/>
      <stop offset="100%" stop-color="#1a1612"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e0b27d"/>
      <stop offset="50%" stop-color="#d4a574"/>
      <stop offset="100%" stop-color="#b8956a"/>
    </linearGradient>
    <radialGradient id="orb1" cx="80%" cy="20%" r="40%">
      <stop offset="0%" stop-color="#d4a574" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#d4a574" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="10%" cy="90%" r="35%">
      <stop offset="0%" stop-color="#b8956a" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#b8956a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orb1)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orb2)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#accent)"/>

  <!-- Bottom accent bar -->
  <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#accent)" opacity="0.6"/>

  <!-- Brand lockup (top-left) -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="72" height="72" rx="18" fill="url(#accent)"/>
    <text x="36" y="52" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700" text-anchor="middle" fill="#1a1612">K</text>
  </g>
  <text x="172" y="118" font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#d4a574" letter-spacing="2">KETAB-YAR</text>
  <text x="172" y="148" font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" fill="#8a7a68" letter-spacing="1">BILINGUAL ENGLISH BOOKS WITH AI</text>

  <!-- Vertical accent line -->
  <rect x="80" y="220" width="4" height="280" rx="2" fill="url(#accent)"/>

  <!-- Title -->
  <text x="108" y="320" font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#f3efe8">${safeTitle}</text>

  <!-- Subtitle -->
  <text x="108" y="395" font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${subtitleSize}" font-weight="400" fill="#a89888">${safeSubtitle}</text>

  <!-- Bottom URL / footer -->
  <g transform="translate(80, ${HEIGHT - 80})">
    <rect x="0" y="-4" width="6" height="32" rx="3" fill="url(#accent)" opacity="0.7"/>
    <text x="22" y="20" font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="#a89888" letter-spacing="1">${BRAND_URL}</text>
  </g>

  <!-- Decorative book spine icons (right side) -->
  <g transform="translate(${WIDTH - 200}, 230)" opacity="0.18">
    <rect x="0" y="0" width="36" height="180" rx="4" fill="#d4a574"/>
    <rect x="48" y="-20" width="36" height="200" rx="4" fill="#b8956a"/>
    <rect x="96" y="10" width="36" height="170" rx="4" fill="#e0b27d"/>
  </g>
</svg>`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || BRAND_TITLE
  const subtitle = url.searchParams.get('subtitle') || BRAND_SUBTITLE

  try {
    const svg = buildSvg(title, subtitle)
    const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer()
    // Convert Node Buffer to a standard Uint8Array so it satisfies the
    // BodyInit type expected by NextResponse.
    const bytes = new Uint8Array(png)

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    // H-15: never leak the raw error message to the client — sharp / fs /
    // network errors can include file paths, library internals, or stack
    // frames. Log server-side, return a generic string body.
    console.error('[/api/og] generation failed:', err)
    return new NextResponse('OG image generation failed', { status: 500 })
  }
}
