import dns from 'node:dns'
dns.setDefaultResultOrder('ipv4first')

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import WebSocket from 'ws'
import crypto from 'node:crypto'
import https from 'node:https'
import ZAI from 'z-ai-web-dev-sdk'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'

/**
 * POST /api/tts
 *
 * Generates speech audio from text using Microsoft Edge Neural Voices
 * (via direct WebSocket protocol with Sec-MS-GEC token v2) as primary engine,
 * with z-ai-web-dev-sdk as fallback.
 *
 * Body:
 *   { text: string, lang?: 'en' | 'fa', speed?: number (0.5–2.0), voice?: string }
 *
 * Response (success):
 *   • 200 with `Content-Type: audio/mpeg` and MP3 bytes in the body.
 *   • Optional `X-TTS-Word-Boundaries` header with base64-encoded WordBoundary JSON.
 *
 * Response (degraded):
 *   • 200 with `{ error: 'سرویس صدا در دسترس نیست' }` JSON when both
 *     engines fail. The client uses this signal to surface a graceful
 *     "audio unavailable" toast or fallback.
 *
 * Edge TTS voices:
 *   • en-US-AvaMultilingualNeural    — English female (natural)
 *   • en-US-AndrewMultilingualNeural — English male (natural)
 *   • fa-IR-DilaraNeural             — Persian female (natural)
 *   • fa-IR-FaridNeural              — Persian male (natural)
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_INPUT_CHARS = 500

// ── Security tokens & Edge TTS constants ──────────────────────────────────
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM_FULL_VERSION = '143.0.3650.75'
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0]
const WIN_EPOCH = BigInt('11644473600')
const TICKS_PER_SEC = BigInt('10000000')
const WINDOW_TICKS = BigInt('3000000000')

// Clock skew cache against Microsoft servers (to prevent 429/403 errors due to local clock drift)
let cachedSkewMs = 0
let lastSkewSync = 0

function fetchServerDate(): Promise<number | null> {
  return new Promise((resolve) => {
    const req = https.request(
      'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1',
      { method: 'HEAD', family: 4, timeout: 5000 },
      (res) => {
        const dateStr = res.headers.date
        if (dateStr) {
          const serverDate = new Date(dateStr).getTime()
          resolve(isNaN(serverDate) ? null : serverDate)
        } else {
          resolve(null)
        }
      },
    )
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
    req.on('error', () => {
      resolve(null)
    })
    req.end()
  })
}

async function getClockSkew(force = false): Promise<number> {
  const now = Date.now()
  if (!force && lastSkewSync > 0 && now - lastSkewSync < 10 * 60 * 1000) {
    return cachedSkewMs
  }
  try {
    const serverDate = await fetchServerDate()
    if (serverDate) {
      cachedSkewMs = serverDate - Date.now()
      lastSkewSync = Date.now()
    }
  } catch (e) {
    console.warn('[EdgeTTS] Clock skew check failed, using fallback:', e)
  }
  return cachedSkewMs
}

async function getWindowsTicksToken(forceSkewRefresh = false): Promise<{ token: string; adjustedNow: number }> {
  const skew = await getClockSkew(forceSkewRefresh)
  const adjustedNow = Date.now() + skew
  const sec = Math.floor(adjustedNow / 1000)
  const ticks = (BigInt(sec) + WIN_EPOCH) * TICKS_PER_SEC
  const rounded = ticks - (ticks % WINDOW_TICKS)
  const token = crypto
    .createHash('sha256')
    .update(rounded.toString() + TRUSTED_TOKEN, 'ascii')
    .digest('hex')
    .toUpperCase()
  return { token, adjustedNow }
}

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

interface WordBoundaryItem {
  part: string
  start: number
  end: number
}

// ── Direct Edge TTS engine (primary) ──────────────────────────────────────
async function generateWithEdgeTTS(
  text: string,
  voice: string,
  speed: number,
  retriesLeft = 2,
): Promise<{ buffer: Buffer; wordBoundaries?: WordBoundaryItem[] } | null> {
  try {
    const { token, adjustedNow } = await getWindowsTicksToken(retriesLeft < 2)
    const reqId = crypto.randomUUID().replace(/-/g, '')
    const url = `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=${TRUSTED_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`

    return await new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        family: 4,
        origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      const audioChunks: Buffer[] = []
      const wordBoundaries: WordBoundaryItem[] = []

      const timeout = setTimeout(() => {
        ws.terminate()
        reject(new Error('Edge TTS WebSocket timeout after 15s'))
      }, 15000)

      ws.on('open', () => {
        // 1. Send speech.config
        const configMsg =
          'Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n' +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: 'false',
                    wordBoundaryEnabled: 'true',
                  },
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
                },
              },
            },
          })
        ws.send(configMsg)

        // 2. Format prosody rate & escape XML for SSML
        const ratePct = Math.round((speed - 1) * 100)
        const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`
        const escapedText = text.replace(/[<>&"']/g, (c) => {
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
        const xmlLang = voice.startsWith('fa') ? 'fa-IR' : 'en-US'
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}"><voice name="${voice}"><prosody rate="${rateStr}">${escapedText}</prosody></voice></speak>`
        const date = new Date(adjustedNow).toUTCString()
        const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}Z\r\nPath:ssml\r\n\r\n${ssml}`
        ws.send(ssmlMsg)
      })

      ws.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          const headerLen = data.readUInt16BE(0)
          const header = data.subarray(2, 2 + headerLen).toString('utf-8')
          if (header.includes('Path:audio')) {
            audioChunks.push(data.subarray(2 + headerLen))
          }
        } else {
          const textMsg = data.toString('utf-8')
          if (textMsg.includes('Path:audio.metadata')) {
            try {
              const body = textMsg.split('\r\n\r\n')[1]
              const parsed = JSON.parse(body)
              if (parsed.Metadata) {
                for (const item of parsed.Metadata) {
                  if (item.Type === 'WordBoundary') {
                    wordBoundaries.push({
                      part: item.Data.text.Text,
                      start: Math.round(item.Data.Offset / 10000), // convert 100ns to ms
                      end: Math.round((item.Data.Offset + item.Data.Duration) / 10000),
                    })
                  }
                }
              }
            } catch {}
          }
          if (textMsg.includes('Path:turn.end')) {
            clearTimeout(timeout)
            ws.close()
            const finalBuffer = Buffer.concat(audioChunks)
            if (finalBuffer.length === 0) {
              reject(new Error('Edge TTS returned 0 audio bytes'))
              return
            }
            resolve({
              buffer: finalBuffer,
              wordBoundaries: wordBoundaries.length > 0 ? wordBoundaries : undefined,
            })
          }
        }
      })

      ws.on('unexpected-response', (_req, res) => {
        clearTimeout(timeout)
        lastSkewSync = 0 // Invalidate skew cache
        reject(new Error(`WebSocket handshake failed with status ${res.statusCode}`))
      })

      ws.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    console.error('[tts] Edge TTS attempt failed:', errMessage)
    if (retriesLeft > 0) {
      const is429 = errMessage.includes('429')
      const delay = is429 ? 800 : 300
      console.log(`[tts] Retrying Edge TTS in ${delay}ms (${retriesLeft} retries left)...`)
      await new Promise((r) => setTimeout(r, delay))
      return generateWithEdgeTTS(text, voice, speed, retriesLeft - 1)
    }
    return null
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
