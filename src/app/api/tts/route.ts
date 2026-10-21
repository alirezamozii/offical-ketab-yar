import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import WebSocket from 'ws';
import crypto from 'node:crypto';
import https from 'node:https';
import { spawn } from 'node:child_process';
import ZAI from 'z-ai-web-dev-sdk';
import { aiRateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/api-validate';

/**
 * /api/tts
 *
 * Ultra-Fast, Anti-Fragile Multi-Tier Speech Synthesis:
 *   Tier 0: Hot in-memory LRU cache (< 1ms instant response)
 *   Tier 1: Python edge-tts 7.3.1 (full Sec-MS-GEC v2 protocol, natural Ava/Andrew & Dilara/Farid)
 *   Tier 2: Direct Edge TTS WebSocket client (Node.js fallback with clock-skew correction)
 *   Tier 3: Google Translate TTS (ultra-fast < 1.2s for English dictionary words)
 *   Tier 4: Z-AI TTS fallback
 *
 * Edge TTS voices:
 *   • en-US-AvaMultilingualNeural    — English female (natural)
 *   • en-US-AndrewMultilingualNeural — English male (natural)
 *   • fa-IR-DilaraNeural             — Persian female (natural)
 *   • fa-IR-FaridNeural              — Persian male (natural)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_INPUT_CHARS = 500;

// ── In-memory TTS Cache (Tier 0) ───────────────────────────────────────────
interface CachedAudioEntry {
  buffer: Buffer;
  contentType: string;
  wordBoundaries?: WordBoundaryItem[];
  engine: string;
  createdAt: number;
}
const serverAudioCache = new Map<string, CachedAudioEntry>();
const MAX_SERVER_CACHE = 2000;

// ── Security tokens & Edge TTS constants ──────────────────────────────────
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
const WIN_EPOCH = BigInt('11644473600');
const TICKS_PER_SEC = BigInt('10000000');
const WINDOW_TICKS = BigInt('3000000000');

// Clock skew cache against Microsoft servers
let cachedSkewMs = 0;
let lastSkewSync = 0;

function fetchServerDate(): Promise<number | null> {
  return new Promise((resolve) => {
    const req = https.request(
      'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1',
      { method: 'HEAD', family: 4, timeout: 1200 },
      (res) => {
        const dateStr = res.headers.date;
        res.resume();
        req.destroy();
        if (dateStr) {
          const serverDate = new Date(dateStr).getTime();
          resolve(isNaN(serverDate) ? null : serverDate);
        } else {
          resolve(null);
        }
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => {
      resolve(null);
    });
    req.end();
  });
}

async function getClockSkew(force = false): Promise<number> {
  const now = Date.now();
  if (!force || (lastSkewSync > 0 && now - lastSkewSync < 10 * 60 * 1000)) {
    return cachedSkewMs;
  }
  try {
    const serverDate = await fetchServerDate();
    if (serverDate) {
      cachedSkewMs = serverDate - Date.now();
      lastSkewSync = Date.now();
    }
  } catch {}
  return cachedSkewMs;
}

async function getWindowsTicksToken(
  forceSkewRefresh = false,
): Promise<{ token: string; adjustedNow: number }> {
  const skew = await getClockSkew(forceSkewRefresh);
  const adjustedNow = Date.now() + skew;
  const sec = Math.floor(adjustedNow / 1000);
  const ticks = (BigInt(sec) + WIN_EPOCH) * TICKS_PER_SEC;
  const rounded = ticks - (ticks % WINDOW_TICKS);
  const token = crypto
    .createHash('sha256')
    .update(rounded.toString() + TRUSTED_TOKEN, 'ascii')
    .digest('hex')
    .toUpperCase();
  return { token, adjustedNow };
}

// ── Request body schema ────────────────────────────────────────────────────
const BodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'متن برای تبدیل به صدا وارد نشده است.')
    .max(
      MAX_INPUT_CHARS,
      `متن بیش از حد طولانی است. حداکثر ${MAX_INPUT_CHARS} کاراکتر در هر درخواست.`,
    ),
  lang: z.enum(['en', 'fa']).default('en'),
  speed: z.coerce.number().finite().min(0.25).max(2.0).default(1.0),
  voice: z.string().optional(),
});

// ── Voice mapping ──────────────────────────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
  en: 'en-US-AvaMultilingualNeural',
  'en-female': 'en-US-AvaMultilingualNeural',
  'en-male': 'en-US-AndrewMultilingualNeural',
  'en-US-AvaMultilingualNeural': 'en-US-AvaMultilingualNeural',
  'en-US-AndrewMultilingualNeural': 'en-US-AndrewMultilingualNeural',
  fa: 'fa-IR-DilaraNeural',
  'fa-female': 'fa-IR-DilaraNeural',
  'fa-male': 'fa-IR-FaridNeural',
  'fa-IR-DilaraNeural': 'fa-IR-DilaraNeural',
  'fa-IR-FaridNeural': 'fa-IR-FaridNeural',
};

interface WordBoundaryItem {
  part: string;
  start: number;
  end: number;
}

// ── Tier 1: Python edge-tts 7.3.1 (Sec-MS-GEC v2 engine) ───────────────────
async function generateWithPythonEdgeTTS(
  text: string,
  voice: string,
  speed: number,
  timeoutMs = 9000,
): Promise<{ buffer: Buffer; wordBoundaries?: WordBoundaryItem[] } | null> {
  return new Promise((resolve) => {
    let finished = false;
    const pyCode = `
import asyncio, sys, json, edge_tts

async def run():
    rate_pct = int(round((float(sys.argv[3]) - 1.0) * 100))
    rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"
    comm = edge_tts.Communicate(sys.argv[1], sys.argv[2], rate=rate_str, boundary="WordBoundary")
    chunks = []
    bounds = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            bounds.append({
                "part": chunk.get("text", ""),
                "start": int(chunk.get("offset", 0) / 10000),
                "end": int((chunk.get("offset", 0) + chunk.get("duration", 0)) / 10000),
            })
    audio = b"".join(chunks)
    meta = json.dumps(bounds).encode("utf-8")
    sys.stdout.buffer.write(len(meta).to_bytes(4, "big"))
    sys.stdout.buffer.write(meta)
    sys.stdout.buffer.write(audio)

try:
    asyncio.run(run())
except Exception:
    sys.exit(1)
`;
    const pythonExe = process.env.PYTHON_PATH || 'python';
    let proc: ReturnType<typeof spawn> | null = null;
    try {
      proc = spawn(pythonExe, ['-c', pyCode, text, voice, speed.toString()], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      resolve(null);
      return;
    }

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          proc?.kill();
        } catch {}
        resolve(null);
      }
    }, timeoutMs);

    const chunks: Buffer[] = [];
    proc.stdout?.on('data', (d) => chunks.push(d));
    proc.on('error', () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(null);
      }
    });
    proc.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code !== 0 || chunks.length === 0) {
        resolve(null);
        return;
      }
      try {
        const full = Buffer.concat(chunks);
        if (full.length < 5) {
          resolve(null);
          return;
        }
        const metaLen = full.readUInt32BE(0);
        const metaBuf = full.subarray(4, 4 + metaLen);
        const audioBuf = full.subarray(4 + metaLen);
        let bounds: WordBoundaryItem[] | undefined;
        try {
          const parsed = JSON.parse(metaBuf.toString('utf-8'));
          if (Array.isArray(parsed) && parsed.length > 0) bounds = parsed;
        } catch {}
        resolve({ buffer: audioBuf, wordBoundaries: bounds });
      } catch {
        resolve(null);
      }
    });
  });
}

// ── Tier 2: Direct Edge TTS WebSocket client ──────────────────────────────
async function generateWithEdgeTTS(
  text: string,
  voice: string,
  speed: number,
  retriesLeft = 0,
): Promise<{ buffer: Buffer; wordBoundaries?: WordBoundaryItem[] } | null> {
  try {
    const { token, adjustedNow } = await getWindowsTicksToken(retriesLeft < 0);
    const reqId = crypto.randomUUID().replace(/-/g, '');
    const url = `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=${TRUSTED_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`;

    return await new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        family: 4,
        origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const audioChunks: Buffer[] = [];
      const wordBoundaries: WordBoundaryItem[] = [];

      const timeoutMs = text.length < 100 ? 3000 : 7000;
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error(`Edge TTS WebSocket timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      ws.on('open', () => {
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
          });
        ws.send(configMsg);

        const ratePct = Math.round((speed - 1) * 100);
        const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;
        const escapedText = text.replace(/[<>&"']/g, (c) => {
          switch (c) {
            case '<':
              return '&lt;';
            case '>':
              return '&gt;';
            case '&':
              return '&amp;';
            case '"':
              return '&quot;';
            case "'":
              return '&apos;';
            default:
              return c;
          }
        });
        const xmlLang = voice.startsWith('fa') ? 'fa-IR' : 'en-US';
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}"><voice name="${voice}"><prosody rate="${rateStr}">${escapedText}</prosody></voice></speak>`;
        const date = new Date(adjustedNow).toUTCString();
        const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}Z\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      });

      ws.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          const headerLen = data.readUInt16BE(0);
          const header = data.subarray(2, 2 + headerLen).toString('utf-8');
          if (header.includes('Path:audio')) {
            audioChunks.push(data.subarray(2 + headerLen));
          }
        } else {
          const textMsg = data.toString('utf-8');
          if (textMsg.includes('Path:audio.metadata')) {
            try {
              const body = textMsg.split('\r\n\r\n')[1];
              const parsed = JSON.parse(body);
              if (parsed.Metadata) {
                for (const item of parsed.Metadata) {
                  if (item.Type === 'WordBoundary') {
                    wordBoundaries.push({
                      part: item.Data.text.Text,
                      start: Math.round(item.Data.Offset / 10000),
                      end: Math.round((item.Data.Offset + item.Data.Duration) / 10000),
                    });
                  }
                }
              }
            } catch {}
          }
          if (textMsg.includes('Path:turn.end')) {
            clearTimeout(timeout);
            ws.close();
            const finalBuffer = Buffer.concat(audioChunks);
            if (finalBuffer.length === 0) {
              reject(new Error('Edge TTS returned 0 audio bytes'));
              return;
            }
            resolve({
              buffer: finalBuffer,
              wordBoundaries: wordBoundaries.length > 0 ? wordBoundaries : undefined,
            });
          }
        }
      });

      ws.on('unexpected-response', (_req, res) => {
        clearTimeout(timeout);
        lastSkewSync = 0;
        reject(new Error(`WebSocket handshake failed with status ${res.statusCode}`));
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    // Fail over immediately if rate-limited or auth-rejected
    if (retriesLeft > 0 && !errMessage.includes('429') && !errMessage.includes('403')) {
      await new Promise((r) => setTimeout(r, 200));
      return generateWithEdgeTTS(text, voice, speed, retriesLeft - 1);
    }
    return null;
  }
}

// ── Tier 3: Google Translate TTS (ultra-fast < 1.2s for English dictionary words) ──
async function generateWithGoogleTTS(text: string, lang: 'en' | 'fa'): Promise<Buffer | null> {
  if (lang !== 'en') return null;
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=en&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(2200),
    });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 500) return null;
    return buf;
  } catch {
    return null;
  }
}

// ── Tier 4: Z-AI TTS engine (fallback) ─────────────────────────────────────
let cachedZai: ZAI | null = null;
async function getZai(): Promise<ZAI> {
  if (cachedZai) return cachedZai;
  cachedZai = await ZAI.create();
  return cachedZai;
}

async function generateWithZai(
  text: string,
  lang: 'en' | 'fa',
  speed: number,
): Promise<Buffer | null> {
  try {
    const zai = await getZai();
    const voice = lang === 'fa' ? 'tongtong' : 'jam';

    const response = await zai.audio.tts.create({
      input: text,
      voice,
      speed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    if (!buffer || buffer.length === 0) return null;
    return buffer;
  } catch (err) {
    console.error('[tts] z-ai fallback failed:', err);
    return null;
  }
}

// ── Synthesize Master Pipeline ─────────────────────────────────────────────
async function synthesizeAudio(
  text: string,
  lang: 'en' | 'fa',
  voice: string,
  speed: number,
  isShort = false,
): Promise<{
  buffer: Buffer;
  contentType: string;
  wordBoundaries?: WordBoundaryItem[];
  engine: string;
} | null> {
  const cacheKey = `${text}::${voice}::${speed}`;
  const cached = serverAudioCache.get(cacheKey);
  if (cached) return cached;

  // 1. Python Edge TTS (highest quality, v2 Sec-MS-GEC support)
  const pyTimeout = isShort ? 4500 : 9000;
  const pyResult = await generateWithPythonEdgeTTS(text, voice, speed, pyTimeout);
  if (pyResult && pyResult.buffer.length > 0) {
    const entry: CachedAudioEntry = {
      buffer: pyResult.buffer,
      contentType: 'audio/mpeg',
      wordBoundaries: pyResult.wordBoundaries,
      engine: 'edge-python',
      createdAt: Date.now(),
    };
    if (serverAudioCache.size >= MAX_SERVER_CACHE) {
      const oldestKey = serverAudioCache.keys().next().value;
      if (oldestKey) serverAudioCache.delete(oldestKey);
    }
    serverAudioCache.set(cacheKey, entry);
    return entry;
  }

  // 2. Direct Edge TTS WebSocket client
  const edgeResult = await generateWithEdgeTTS(text, voice, speed, 0);
  if (edgeResult && edgeResult.buffer.length > 0) {
    const entry: CachedAudioEntry = {
      buffer: edgeResult.buffer,
      contentType: 'audio/mpeg',
      wordBoundaries: edgeResult.wordBoundaries,
      engine: 'edge-ws',
      createdAt: Date.now(),
    };
    serverAudioCache.set(cacheKey, entry);
    return entry;
  }

  // 3. Ultra-fast Google TTS (especially for English dictionary words and single phrases)
  if (lang === 'en') {
    const googleBuf = await generateWithGoogleTTS(text, lang);
    if (googleBuf && googleBuf.length > 0) {
      const entry: CachedAudioEntry = {
        buffer: googleBuf,
        contentType: 'audio/mpeg',
        engine: 'google-tts',
        createdAt: Date.now(),
      };
      serverAudioCache.set(cacheKey, entry);
      return entry;
    }
  }

  // 4. Fallback to z-ai SDK
  const zaiBuffer = await generateWithZai(text, lang, speed);
  if (zaiBuffer && zaiBuffer.length > 0) {
    const entry: CachedAudioEntry = {
      buffer: zaiBuffer,
      contentType: 'audio/wav',
      engine: 'zai-fallback',
      createdAt: Date.now(),
    };
    serverAudioCache.set(cacheKey, entry);
    return entry;
  }

  return null;
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const blocked = await aiRateLimit(req, { anonLimit: 15, authLimit: 30, name: 'tts' });
  if (blocked) return blocked;

  const parsed = await parseBody(req, BodySchema);
  if (!parsed.ok) return parsed.response;
  const { text, lang, speed, voice: voiceOverride } = parsed.data;

  const voiceKey = voiceOverride || lang;
  const edgeVoice = VOICE_MAP[voiceKey] || voiceOverride || VOICE_MAP[lang];
  const result = await synthesizeAudio(text, lang, edgeVoice, speed, false);
  if (result) {
    const headers: Record<string, string> = {
      'Content-Type': result.contentType,
      'Content-Length': result.buffer.length.toString(),
      'Cache-Control': 'no-store',
      'X-TTS-Engine': result.engine,
      'X-TTS-Voice': edgeVoice,
      'X-TTS-Lang': lang,
    };
    if (result.wordBoundaries && result.wordBoundaries.length > 0) {
      headers['X-TTS-Word-Boundaries'] = Buffer.from(
        JSON.stringify(result.wordBoundaries),
      ).toString('base64');
    }
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers,
    });
  }

  return NextResponse.json(
    { error: 'سرویس صدا در دسترس نیست' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

/**
 * GET /api/tts
 * If `?text=...` is provided, generates and returns the TTS audio stream (ideal for dictionary word pronunciation).
 * Otherwise returns metadata with available voices.
 */
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')?.trim();
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
    );
  }

  const blocked = await aiRateLimit(req, { anonLimit: 20, authLimit: 60, name: 'tts-get' });
  if (blocked) return blocked;

  const lang = req.nextUrl.searchParams.get('lang') === 'fa' ? 'fa' : 'en';
  const edgeVoice = VOICE_MAP[lang] || VOICE_MAP.en;
  const isShort = text.length <= 80;

  const result = await synthesizeAudio(text.slice(0, 200), lang, edgeVoice, 1.0, isShort);
  if (result) {
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.buffer.length.toString(),
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000',
        'X-TTS-Engine': result.engine,
      },
    });
  }

  return NextResponse.json({ error: 'صدا در دسترس نیست' }, { status: 500 });
}
