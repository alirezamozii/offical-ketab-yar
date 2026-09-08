import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EdgeTTS } from 'node-edge-tts'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import ZAI from 'z-ai-web-dev-sdk'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'

/**
 * POST /api/tts
 *
 * Generates speech audio from text using Edge TTS (free Azure neural
 * voices) as the primary engine, with z-ai-web-dev-sdk as fallback.
 *
 * Body:
 *   { text: string, lang?: 'en' | 'fa', speed?: number (0.5–2.0), voice?: string }
 *
 * Response (success):
 *   • 200 with `Content-Type: audio/mpeg` and MP3 bytes in the body.
 *
 * Response (degraded):
 *   • 200 with `{ error: 'سرویس صدا در دسترس نیست' }` JSON when both
 *     engines fail. The client uses this signal to surface a graceful
 *     "audio unavailable" toast.
 *
 * Edge TTS voices (free, neural, high-quality):
 *   • en-US-AvaMultilingualNeural  — English female (default for en)
 *   • en-US-AndrewMultilingualNeural — English male
 *   • fa-IR-FaridNeural            — Persian male (default for fa)
 *   • fa-IR-DilaraNeural           — Persian female
 *
 * Owner: Phase 4 R-TTS.2
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_INPUT_CHARS = 500

// ── Request body schema ────────────────────────────────────────────────────
const BodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'متن برای تبدیل به صدا وارد نشده است.')
    .max(MAX_INPUT_CHARS, `متن بیش از حد طولانی است. حداکثر ${MAX_INPUT_CHARS} کاراکتر در هر درخواست.`),
  lang: z.enum(['en', 'fa']).default('en'),
  speed: z.coerce.number().finite().min(0.25).max(2.0).default(1.0),
  voice: z.string().optional(),
})

// ── Voice mapping ──────────────────────────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
  'en': 'en-US-AvaMultilingualNeural',
  'en-female': 'en-US-AvaMultilingualNeural',
  'en-male': 'en-US-AndrewMultilingualNeural',
  'en-US-AvaMultilingualNeural': 'en-US-AvaMultilingualNeural',
  'en-US-AndrewMultilingualNeural': 'en-US-AndrewMultilingualNeural',
  'fa': 'fa-IR-DilaraNeural',
  'fa-female': 'fa-IR-DilaraNeural',
  'fa-male': 'fa-IR-FaridNeural',
  'fa-IR-DilaraNeural': 'fa-IR-DilaraNeural',
  'fa-IR-FaridNeural': 'fa-IR-FaridNeural',
}

/** Convert speed (0.5–2.0) to Edge TTS rate format (+0%, -50%, etc.) */
function speedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

interface WordBoundaryItem {
  part: string
  start: number
  end: number
}

// ── Edge TTS engine (primary) ──────────────────────────────────────────────
async function generateWithEdgeTTS(
  text: string,
  voice: string,
  speed: number,
): Promise<{ buffer: Buffer; wordBoundaries?: WordBoundaryItem[] } | null> {
  const tmpDir = os.tmpdir()
  const id = randomUUID()
  const tmpFile = path.join(tmpDir, `tts-${id}.mp3`)
  const subFile = path.join(tmpDir, `tts-${id}.mp3.json`)

  try {
    const tts = new EdgeTTS({
      voice,
      rate: speedToRate(speed),
      volume: '+0%',
      timeout: 15_000,
      saveSubtitles: true,
    })

    await tts.ttsPromise(text, tmpFile)
    const buffer = await fs.readFile(tmpFile)

    let wordBoundaries: WordBoundaryItem[] | undefined
    try {
      const subContent = await fs.readFile(subFile, 'utf-8')
      const parsed = JSON.parse(subContent)
      if (Array.isArray(parsed) && parsed.length > 0) {
        wordBoundaries = parsed
      }
    } catch {
      // Subtitle file might not be generated if edge-tts had no word boundaries
    }

    if (!buffer || buffer.length === 0) return null
    return { buffer, wordBoundaries }
  } catch (err) {
    console.error('[tts] edge-tts failed:', err)
    return null
  } finally {
    // Clean up temp files
    try {
      await fs.unlink(tmpFile)
    } catch {}
    try {
      await fs.unlink(subFile)
    } catch {}
  }
}

// ── Z-AI TTS engine (fallback) ─────────────────────────────────────────────
let cachedZai: ZAI | null = null
async function getZai(): Promise<ZAI> {
  if (cachedZai) return cachedZai
  cachedZai = await ZAI.create()
  return cachedZai
}

async function generateWithZai(
  text: string,
  lang: 'en' | 'fa',
  speed: number,
): Promise<Buffer | null> {
  try {
    const zai = await getZai()
    const voice = lang === 'fa' ? 'tongtong' : 'jam'

    const response = await zai.audio.tts.create({
      input: text,
      voice,
      speed,
      response_format: 'wav',
      stream: false,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))
    if (!buffer || buffer.length === 0) return null
    return buffer
  } catch (err) {
    console.error('[tts] z-ai fallback failed:', err)
    return null
  }
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const blocked = await aiRateLimit(req, { anonLimit: 15, authLimit: 30, name: 'tts' })
  if (blocked) return blocked

  const parsed = await parseBody(req, BodySchema)
  if (!parsed.ok) return parsed.response
  const { text, lang, speed, voice: voiceOverride } = parsed.data

  // Resolve voice: explicit override > lang default
  const voiceKey = voiceOverride || lang
  const edgeVoice = VOICE_MAP[voiceKey] || voiceOverride || VOICE_MAP[lang]

  // ── Try Edge TTS first (free, high-quality neural voices) ──
  const edgeResult = await generateWithEdgeTTS(text, edgeVoice, speed)
  if (edgeResult) {
    const { buffer, wordBoundaries } = edgeResult
    const headers: Record<string, string> = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
      'X-TTS-Engine': 'edge',
      'X-TTS-Voice': edgeVoice,
      'X-TTS-Lang': lang,
    }
    if (wordBoundaries && wordBoundaries.length > 0) {
      headers['X-TTS-Word-Boundaries'] = Buffer.from(
        JSON.stringify(wordBoundaries),
      ).toString('base64')
    }
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers,
    })
  }

  // ── Fall back to z-ai SDK ──
  const zaiBuffer = await generateWithZai(text, lang, speed)
  if (zaiBuffer) {
    return new NextResponse(new Uint8Array(zaiBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': zaiBuffer.length.toString(),
        'Cache-Control': 'no-store',
        'X-TTS-Engine': 'zai-fallback',
        'X-TTS-Lang': lang,
      },
    })
  }

  // ── Both engines failed — graceful degradation ──
  return NextResponse.json(
    { error: 'سرویس صدا در دسترس نیست' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}

/**
 * GET /api/tts
 * If `?text=...` is provided, generates and returns the Edge TTS audio stream (ideal for dictionary word pronunciation).
 * Otherwise returns metadata with available voices.
 */
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')?.trim()
  if (!text) {
    return NextResponse.json(
      {
        ok: true,
        service: 'tts',
        maxChars: MAX_INPUT_CHARS,
        engine: 'edge-tts',
        voices: Object.keys(VOICE_MAP),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const blocked = await aiRateLimit(req, { anonLimit: 20, authLimit: 60, name: 'tts-get' })
  if (blocked) return blocked

  const lang = req.nextUrl.searchParams.get('lang') === 'fa' ? 'fa' : 'en'
  const edgeVoice = VOICE_MAP[lang] || VOICE_MAP.en
  const edgeResult = await generateWithEdgeTTS(text.slice(0, 200), edgeVoice, 1.0)
  if (edgeResult) {
    return new NextResponse(new Uint8Array(edgeResult.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': edgeResult.buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-TTS-Engine': 'edge',
      },
    })
  }

  // Fallback to z-ai SDK
  const zaiBuffer = await generateWithZai(text.slice(0, 200), lang, 1.0)
  if (zaiBuffer) {
    return new NextResponse(new Uint8Array(zaiBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': zaiBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-TTS-Engine': 'zai-fallback',
      },
    })
  }

  return NextResponse.json({ error: 'صدا در دسترس نیست' }, { status: 500 })
}
