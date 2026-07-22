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
  speed: z.coerce.number().finite().min(0.5).max(2.0).default(1.0),
  voice: z.string().optional(),
})

// ── Voice mapping ──────────────────────────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
  'en': 'en-US-AvaMultilingualNeural',
  'en-female': 'en-US-AvaMultilingualNeural',
  'en-male': 'en-US-AndrewMultilingualNeural',
  'fa': 'fa-IR-FaridNeural',
  'fa-male': 'fa-IR-FaridNeural',
  'fa-female': 'fa-IR-DilaraNeural',
}

/** Convert speed (0.5–2.0) to Edge TTS rate format (+0%, -50%, etc.) */
function speedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

// ── Edge TTS engine (primary) ──────────────────────────────────────────────
async function generateWithEdgeTTS(
  text: string,
  voice: string,
  speed: number,
): Promise<Buffer | null> {
  const tmpDir = os.tmpdir()
  const tmpFile = path.join(tmpDir, `tts-${randomUUID()}.mp3`)

  try {
    const tts = new EdgeTTS({
      voice,
      rate: speedToRate(speed),
      volume: '+0%',
      timeout: 15_000,
    })

    await tts.ttsPromise(text, tmpFile)
    const buffer = await fs.readFile(tmpFile)

    if (!buffer || buffer.length === 0) return null
    return buffer
  } catch (err) {
    console.error('[tts] edge-tts failed:', err)
    return null
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tmpFile)
    } catch {
      /* ignore */
    }
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
  const edgeVoice = VOICE_MAP[voiceKey] || VOICE_MAP[lang]

  // ── Try Edge TTS first (free, high-quality neural voices) ──
  const edgeBuffer = await generateWithEdgeTTS(text, edgeVoice, speed)
  if (edgeBuffer) {
    return new NextResponse(new Uint8Array(edgeBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': edgeBuffer.length.toString(),
        'Cache-Control': 'no-store',
        'X-TTS-Engine': 'edge',
        'X-TTS-Voice': edgeVoice,
        'X-TTS-Lang': lang,
      },
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
 * GET /api/tts — metadata endpoint with available voices.
 */
export async function GET() {
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
