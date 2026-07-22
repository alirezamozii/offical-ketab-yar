/**
 * One-off icon generator — produces the PNG icons required for Chrome PWA
 * installability + iOS apple-touch-icon + a favicon.
 *
 * Source: public/logo.svg (a 30×30 viewBox SVG: rounded-square dark
 * background with a white stylized "K"/book glyph).
 *
 * Outputs:
 *   public/icons/icon-192.png          (192×192, purpose "any")
 *   public/icons/icon-512.png          (512×512, purpose "any")
 *   public/icons/icon-maskable-512.png (512×512, purpose "maskable")
 *                                       — full-bleed gold background so the
 *                                         safe-zone (40% diameter) is filled
 *   public/apple-touch-icon.png        (180×180, iOS)
 *   public/favicon.ico                 (32×32 PNG payload inside .ico —
 *                                       supported by every modern browser)
 *
 * The maskable variant uses the gold brand color (#b8956a) as background
 * instead of the SVG's dark (#2D2D2D), so the icon reads well on Android
 * adaptive-icon masks (which crop the outer ~20%).
 */

import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const ICONS = resolve(PUBLIC, 'icons')

// Brand palette (matches theme_color / background_color in manifest.json)
const GOLD = '#b8956a'
const CREAM = '#f3efe8'

// The logo SVG uses a 30×30 viewBox with the rounded-square background
// filling it. We strip the animation class (it has no effect on raster
// output) and re-render at the target size with a density that keeps the
// 0.6px stroke crisp.
async function loadLogoBuffer() {
  const raw = await readFile(resolve(PUBLIC, 'logo.svg'), 'utf8')
  // Drop the `z-breathe` animation class — it sets opacity 0.7→1→0.7 which
  // could rasterize at the low end. Lock the glyph to opacity 1 so the
  // rendered icon matches the brand identity.
  return Buffer.from(
    raw
      .replace(/<g class="z-breathe">/g, '<g>')
      .replace(/\.z-breathe\s*\{[^}]*\}/g, '')
      .replace(/@keyframes breathe\s*\{[^}]*\}/g, '')
      .replace(/[\r\n]+\s*[\r\n]+/g, '\n'),
  )
}

async function renderPlain(svgBuf, size) {
  // For the "any" purpose icons we keep the SVG's own dark background
  // (the rounded square). No padding — the SVG already fills its viewBox.
  return sharp(svgBuf, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer()
}

async function renderMaskable(svgBuf, size) {
  // For maskable icons Android crops the outer ~20% (safe zone = inner
  // 80% diameter, ~40% radius). We composite the SVG glyph on a full-bleed
  // gold square so the masked result is recognisable on any shape.
  // The glyph is scaled to ~70% of the canvas so it sits inside the safe
  // zone with comfortable padding.
  const glyphSize = Math.round(size * 0.7)
  const offset = Math.round((size - glyphSize) / 2)

  const glyph = await sharp(svgBuf, { density: 384 })
    .resize(glyphSize, glyphSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Build a flat gold base, then composite the glyph on top.
  const base = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: GOLD,
    },
  })
    .png()
    .toBuffer()

  return sharp(base)
    .composite([{ input: glyph, left: offset, top: offset }])
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer()
}

async function renderAppleTouch(svgBuf, size) {
  // iOS apple-touch-icon should NOT have transparency (iOS composites on
  // its own background). We composite on a cream background to match the
  // manifest's background_color, so the icon reads well on iOS home screen.
  const glyphSize = Math.round(size * 0.78)
  const offset = Math.round((size - glyphSize) / 2)

  const glyph = await sharp(svgBuf, { density: 384 })
    .resize(glyphSize, glyphSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const base = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: CREAM,
    },
  })
    .png()
    .toBuffer()

  return sharp(base)
    .composite([{ input: glyph, left: offset, top: offset }])
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer()
}

async function main() {
  console.log('[pwa-icons] reading logo.svg…')
  const svgBuf = await loadLogoBuffer()

  console.log('[pwa-icons] rendering 192×192 (any)…')
  await writeFile(resolve(ICONS, 'icon-192.png'), await renderPlain(svgBuf, 192))

  console.log('[pwa-icons] rendering 512×512 (any)…')
  await writeFile(resolve(ICONS, 'icon-512.png'), await renderPlain(svgBuf, 512))

  console.log('[pwa-icons] rendering 512×512 (maskable)…')
  await writeFile(resolve(ICONS, 'icon-maskable-512.png'), await renderMaskable(svgBuf, 512))

  console.log('[pwa-icons] rendering 180×180 (apple-touch-icon)…')
  await writeFile(resolve(PUBLIC, 'apple-touch-icon.png'), await renderAppleTouch(svgBuf, 180))

  // favicon.ico — browsers accept a PNG payload inside an .ico container.
  // We write a 32×32 PNG; modern Chrome/Firefox/Safari/Edge all read it
  // correctly. (A true multi-resolution ICO would require an ICO encoder;
  // PNG-in-ICO has been supported since IE9 / Chrome 9 / Firefox 4.)
  console.log('[pwa-icons] rendering favicon.ico (32×32 PNG payload)…')
  const faviconPng = await renderPlain(svgBuf, 32)
  // Wrap the PNG in a minimal ICO container (ICONDIR + ICONDIRENTRY + PNG).
  const ico = wrapPngAsIco(faviconPng)
  await writeFile(resolve(PUBLIC, 'favicon.ico'), ico)

  // Also write a small 32×32 favicon.png for explicit <link> use.
  await writeFile(resolve(PUBLIC, 'favicon-32.png'), faviconPng)

  console.log('[pwa-icons] ✓ all icons generated.')
}

/**
 * Build a minimal multi-image ICO containing a single PNG. Format:
 *   ICONDIR  (6 bytes)  — reserved(2)=0, type(2)=1, count(2)=1
 *   ICONDIRENTRY (16 bytes) — width(1), height(1), colors(1)=0, reserved(1)=0,
 *                              planes(2)=1, bpp(2)=32, size(4), offset(4)=22
 *   PNG data
 */
function wrapPngAsIco(pngBuf) {
  const ico = Buffer.alloc(6 + 16 + pngBuf.length)
  ico.writeUInt16LE(0, 0) // reserved
  ico.writeUInt16LE(1, 2) // type = 1 (icon)
  ico.writeUInt16LE(1, 4) // count = 1
  // ICONDIRENTRY
  ico.writeUInt8(32, 6) // width (0 = 256, but 32 is fine here)
  ico.writeUInt8(32, 7) // height
  ico.writeUInt8(0, 8) // color count (0 = ≥256)
  ico.writeUInt8(0, 9) // reserved
  ico.writeUInt16LE(1, 10) // color planes
  ico.writeUInt16LE(32, 12) // bits per pixel
  ico.writeUInt32LE(pngBuf.length, 14) // image size
  ico.writeUInt32LE(22, 18) // image offset (right after ICONDIRENTRY)
  pngBuf.copy(ico, 22)
  return ico
}

main().catch((err) => {
  console.error('[pwa-icons] FAILED:', err)
  process.exit(1)
})
