'use client'

/**
 * useTTS — client hook for text-to-speech playback.
 *
 * Calls the `/api/tts` API route (server-side, where z-ai-web-dev-sdk is
 * imported) to generate WAV audio, then plays it through an HTMLAudioElement.
 *
 * Features:
 *   • `speak(text, lang?)` — generate + play. If something is already
 *     playing, it stops the previous playback first.
 *   • `stop()` — stops current playback (does not clear the cache).
 *   • `pause()` / `resume()` — soft pause/resume of the current clip.
 *   • `isPlaying` — true while audio is actively playing.
 *   • `isLoading` — true while a network request is in flight.
 *   • `error` — last error string (Persian) or null.
 *   • `progress` — playback progress 0..1 (for floating-player UIs).
 *   • `durationSec` / `elapsedSec` — current clip length + position.
 *   • `currentText` — the text currently being read (for "now reading" UIs).
 *
 * Audio blobs are cached in a `Map<cacheKey, Blob>` keyed by `${lang}|${text}`
 * so repeat plays don't re-hit the network. Cache is bounded to 32 entries
 * (LRU-ish: oldest evicted on overflow) to keep memory predictable.
 *
 * Errors are surfaced via `sonner` toast with Persian copy.
 *
 * Lifecycle: on unmount the audio element is paused + its `src` revoked.
 *
 * `TTSProvider` + `useTTSContext()` are provided so multiple UIs in the
 * same tree (e.g. toolbar button + floating bottom bar) can share a single
 * playback instance. The vocabulary dialog/cards call `useTTS()` directly
 * since their playback is independent of the reader's.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store'
import { toast } from 'sonner'

export type TTSLang = 'en' | 'fa'

export interface UseTTSReturn {
  speak: (text: string, lang?: TTSLang) => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  error: string | null
  progress: number
  durationSec: number
  elapsedSec: number
  currentText: string
  /** 1-based index of the chunk currently playing (for multi-chunk playback). */
  chunkIndex: number
  /** Total chunks in the current playback queue (1 for short texts). */
  totalChunks: number
}

const MAX_CACHE_ENTRIES = 32

// The /api/tts route caps input at 500 chars per request. Long passages
// (a full reader page) are split into chunks under this limit at sentence
// boundaries and played back-to-back so the user can listen to a whole
// page without manually re-clicking.
const MAX_CHUNK_CHARS = 480

function cacheKey(text: string, lang: TTSLang, voice: string, speed: number) {
  return `${lang}|${voice}|${speed}|${text}`
}

/**
 * Split `text` into chunks ≤ `maxChars`, preferring sentence boundaries.
 * Falls back to word boundaries, then to hard character splits. Always
 * returns at least one chunk (the trimmed text itself) for non-empty input.
 */
function splitIntoChunks(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const clean = text.trim()
  if (clean.length <= maxChars) return clean ? [clean] : []

  const chunks: string[] = []
  // Try sentence boundaries first (EN + FA punctuation).
  const sentences = clean.match(/[^.!?؟!]+[.!?؟!]+\s*/g) || [clean]
  let cur = ''
  for (const s of sentences) {
    if (s.length > maxChars) {
      // Flush current chunk first.
      if (cur.trim()) {
        chunks.push(cur.trim())
        cur = ''
      }
      // Sub-split this long sentence at word boundaries.
      const words = s.split(/\s+/)
      let w = ''
      for (const word of words) {
        if ((w + ' ' + word).trim().length > maxChars) {
          if (w.trim()) chunks.push(w.trim())
          w = word
        } else {
          w = (w + ' ' + word).trim()
        }
      }
      if (w.trim()) chunks.push(w.trim())
      continue
    }
    if ((cur + s).length <= maxChars) {
      cur += s
    } else {
      if (cur.trim()) chunks.push(cur.trim())
      cur = s
    }
  }
  if (cur.trim()) chunks.push(cur.trim())
  return chunks.filter(Boolean)
}

export function useTTS(): UseTTSReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const cacheRef = useRef<Map<string, Blob>>(new Map())
  const currentKeyRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  // Queue of pending chunks for long-form playback (e.g. a full reader page).
  const queueRef = useRef<string[]>([])
  const queueLangRef = useRef<TTSLang>('en')
  const totalChunksRef = useRef<number>(0)
  const chunkIndexRef = useRef<number>(0)
  const isFallbackActiveRef = useRef<boolean>(false)
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const playNextChunkRef = useRef<(() => void) | null>(null)
  // AbortController for the in-flight /api/tts fetch. Aborted when a new
  // speak() call supersedes the current one and on unmount — prevents
  // memory leaks + the "setState on unmounted component" React warning.
  const fetchAbortRef = useRef<AbortController | null>(null)
  const [chunkIndex, setChunkIndex] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [currentText, setCurrentText] = useState('')

  // ---- Lazily create the audio element on the client ----
  const getAudio = useCallback((): HTMLAudioElement => {
    if (typeof window === 'undefined') {
      throw new Error('useTTS can only be used in the browser')
    }
    if (!audioRef.current) {
      const el = new Audio()
      el.preload = 'auto'
      // Modest default; users can still use the OS mixer.
      el.volume = 1
      audioRef.current = el
    }
    return audioRef.current
  }, [])

  // ---- Stop the rAF loop that updates elapsed time / progress ----
  const cancelTick = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // ---- Stop playback immediately + revoke any object URL ----
  const stop = useCallback(() => {
    cancelTick()
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      isFallbackActiveRef.current = false
      fallbackUtteranceRef.current = null
    }
    // Abort any in-flight /api/tts fetch so its `.then` doesn't fire on a
    // stopped / unmounted instance.
    fetchAbortRef.current?.abort()
    fetchAbortRef.current = null
    queueRef.current = []
    totalChunksRef.current = 0
    chunkIndexRef.current = 0
    setTotalChunks(0)
    setChunkIndex(0)
    const el = audioRef.current
    if (el) {
      try {
        el.pause()
        el.currentTime = 0
        if (el.src) {
          el.removeAttribute('src')
          el.load()
        }
      } catch {}
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    currentKeyRef.current = null
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setElapsedSec(0)
    setDurationSec(0)
    setCurrentText('')
  }, [cancelTick])

  // ---- Tick loop: drives progress + elapsed time state ----
  //
  // **rAF throttle (P0, audit 03 §5.3):** the original loop called 3
  // `setState`s × 60fps = ~180 re-renders/sec of the TTSProvider subtree
  // (which wraps the entire reader tree). We keep the rAF scheduler for
  // smoothness but only call the `setState`s when at least 250ms have
  // elapsed since the last update (~4Hz). This cuts re-renders by ~15×
  // during audio playback with no perceptible UI difference — the
  // progress bar's CSS `transition: width 120ms linear` smooths the
  // 4Hz jumps into continuous motion.
  const startTick = useCallback(() => {
    cancelTick()
    let lastUpdateMs = 0
    const loop = () => {
      const el = audioRef.current
      if (!el) return
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      if (now - lastUpdateMs >= 250) {
        lastUpdateMs = now
        const dur = Number.isFinite(el.duration) ? el.duration : 0
        const pos = el.currentTime || 0
        setElapsedSec(pos)
        setDurationSec(dur)
        setProgress(dur > 0 ? Math.min(1, pos / dur) : 0)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [cancelTick])

  // ---- Fetch a single chunk's audio (cache-aware) and load it into the element ----
  const loadChunk = useCallback(
    async (text: string, lang: TTSLang): Promise<boolean> => {
      const el = getAudio()
      const { voiceId, audioSpeed } = useReaderSettingsStore.getState()
      const selectedVoice = voiceId.startsWith(lang) ? voiceId : (lang === 'fa' ? 'fa-IR-FaridNeural' : 'en-US-AvaMultilingualNeural')
      const key = cacheKey(text, lang, selectedVoice, audioSpeed)

      let blob = cacheRef.current.get(key)
      if (!blob) {
        // Abort any previously in-flight fetch (e.g. user clicked speak
        // again before the last fetch finished). The AbortController is
        // also aborted on unmount + on stop().
        fetchAbortRef.current?.abort()
        const ctrl = new AbortController()
        fetchAbortRef.current = ctrl
        let res: Response
        try {
          res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              lang,
              voice: selectedVoice,
              speed: audioSpeed,
            }),
            signal: ctrl.signal,
          })
        } catch (err) {
          // AbortError is expected on supersession / unmount — don't toast.
          if (err instanceof DOMException && err.name === 'AbortError') {
            return false
          }
          throw err
        }
        const ct = res.headers.get('content-type') || ''
        if (!res.ok || ct.includes('application/json')) {
          const j = await res.json().catch(() => ({}))
          const msg =
            (j && typeof j.error === 'string' && j.error) ||
            'سرویس صدا در دسترس نیست'
          setError(msg)
          toast.error(msg)
          return false
        }
        blob = await res.blob()
        if (!blob || blob.size === 0) {
          const msg = 'سرویس صدا در دسترس نیست'
          setError(msg)
          toast.error(msg)
          return false
        }
        cacheRef.current.set(key, blob)
        if (cacheRef.current.size > MAX_CACHE_ENTRIES) {
          const firstKey = cacheRef.current.keys().next().value
          if (firstKey) cacheRef.current.delete(firstKey)
        }
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      currentKeyRef.current = key
      el.src = url
      return true
    },
    [getAudio],
  )

  // ---- Web Speech API Fallback Player ----
  const playFallback = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      stop()
      return
    }
    window.speechSynthesis.cancel()
    const { audioSpeed } = useReaderSettingsStore.getState()
    const utterance = new SpeechSynthesisUtterance(text)
    
    const lang = queueLangRef.current
    utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US'
    utterance.rate = audioSpeed

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find((v) => v.lang.startsWith(lang))
    if (voice) utterance.voice = voice

    utterance.onend = () => {
      // Advance chunk queue
      playNextChunkRef.current?.()
    }
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error('[tts] fallback error:', e)
        stop()
      }
    }
    fallbackUtteranceRef.current = utterance
    setIsPlaying(true)
    setIsPaused(false)
    window.speechSynthesis.speak(utterance)
  }, [stop])

  // ---- Advance to the next queued chunk (if any) ----
  const playNextChunk = useCallback(async (): Promise<void> => {
    const next = queueRef.current.shift()
    if (next == null) {
      // Queue drained — natural end of long-form playback.
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(1)
      setCurrentText('')
      setTotalChunks(0)
      setChunkIndex(0)
      totalChunksRef.current = 0
      chunkIndexRef.current = 0
      isFallbackActiveRef.current = false
      return
    }
    chunkIndexRef.current += 1
    setChunkIndex(chunkIndexRef.current)
    setCurrentText(next)

    // If fallback is already active, play via Web Speech
    if (isFallbackActiveRef.current) {
      playFallback(next)
      return
    }

    setIsLoading(true)
    const ok = await loadChunk(next, queueLangRef.current)
    if (!ok) {
      // API failed! Fallback to Web Speech API
      isFallbackActiveRef.current = true
      setIsLoading(false)
      playFallback(next)
      return
    }
    setIsLoading(false)
    startTick()
    const el = audioRef.current
    if (!el) return
    try {
      await el.play()
      setIsPlaying(true)
      setIsPaused(false)
    } catch (playErr) {
      console.error('[tts] play failed, trying fallback:', playErr)
      isFallbackActiveRef.current = true
      playFallback(next)
    }
  }, [loadChunk, playFallback, startTick, stop])

  // Keep playNextChunkRef updated
  useEffect(() => {
    playNextChunkRef.current = playNextChunk
  }, [playNextChunk])

  // ---- Core: speak arbitrary text (auto-chunks if too long) ----
  const speak = useCallback(
    async (text: string, lang: TTSLang = 'en') => {
      const clean = String(text || '').trim()
      if (!clean) return

      const chunks = splitIntoChunks(clean, MAX_CHUNK_CHARS)
      if (chunks.length === 0) return

      const { voiceId, audioSpeed } = useReaderSettingsStore.getState()
      const selectedVoice = voiceId.startsWith(lang) ? voiceId : (lang === 'fa' ? 'fa-IR-FaridNeural' : 'en-US-AvaMultilingualNeural')

      // If the same single-chunk text is already playing, do nothing.
      if (
        chunks.length === 1 &&
        currentKeyRef.current === cacheKey(chunks[0], lang, selectedVoice, audioSpeed) &&
        audioRef.current &&
        !audioRef.current.paused
      ) {
        return
      }

      // Stop any current playback before starting a new one.
      const el = getAudio()
      try {
        el.pause()
        el.currentTime = 0
        if (el.src) {
          el.removeAttribute('src')
          el.load()
        }
      } catch {}
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      queueRef.current = chunks.slice(1) // remaining chunks after the first
      queueLangRef.current = lang
      totalChunksRef.current = chunks.length
      chunkIndexRef.current = 0
      setTotalChunks(chunks.length)
      setChunkIndex(0)
      setIsPlaying(false)
      setIsPaused(false)
      setError(null)
      setCurrentText(chunks[0])
      setIsLoading(true)

      const ok = await loadChunk(chunks[0], lang)
      if (!ok) {
        // API failed! Fallback to Web Speech API
        isFallbackActiveRef.current = true
        setIsLoading(false)
        playFallback(chunks[0])
        return
      }
      setIsLoading(false)
      startTick()
      try {
        await el.play()
        setIsPlaying(true)
        setIsPaused(false)
      } catch (playErr) {
        console.error('[tts] play failed, trying fallback:', playErr)
        isFallbackActiveRef.current = true
        playFallback(chunks[0])
      }
    },
    [getAudio, loadChunk, playFallback, startTick, stop],
  )

  const pause = useCallback(() => {
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause()
        setIsPlaying(false)
        setIsPaused(true)
      }
      return
    }
    const el = audioRef.current
    if (el && !el.paused) {
      el.pause()
      setIsPlaying(false)
      setIsPaused(true)
      cancelTick()
    }
  }, [cancelTick])

  const resume = useCallback(() => {
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume()
        setIsPlaying(true)
        setIsPaused(false)
      }
      return
    }
    const el = audioRef.current
    if (el && el.paused && el.src) {
      el.play()
        .then(() => {
          setIsPlaying(true)
          setIsPaused(false)
          startTick()
        })
        .catch((err) => {
          console.error('[tts] resume failed:', err)
          toast.error('ادامه پخش صدا ناموفق بود.')
        })
    }
  }, [startTick])

  // ---- Wire <audio> events ----
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onEnded = () => {
      cancelTick()
      // If there are more chunks queued, advance to the next one.
      if (queueRef.current.length > 0) {
        setProgress(0)
        setElapsedSec(0)
        setDurationSec(0)
        // Fire-and-forget — internal errors are toasted inside.
        playNextChunk()
        return
      }
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(1)
      // Reset elapsed so the UI shows the final position briefly.
      const d = Number.isFinite(el.duration) ? el.duration : 0
      setElapsedSec(d)
      // Clear the "current text" so floating UIs auto-hide.
      // Keep currentKeyRef set so re-speaking the same text re-fetches cleanly.
      setCurrentText('')
      setTotalChunks(0)
      setChunkIndex(0)
      totalChunksRef.current = 0
      chunkIndexRef.current = 0
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
    const onError = () => {
      cancelTick()
      setIsPlaying(false)
      setIsPaused(false)
      setIsLoading(false)
      setError('پخش صدا با خطا مواجه شد.')
      // Don't toast here — the fetch error path already toasted.
    }

    el.addEventListener('ended', onEnded)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('error', onError)
    }
  }, [cancelTick, playNextChunk])

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      cancelTick()
      // Abort any in-flight /api/tts fetch so its `.then` doesn't fire
      // after the component is gone (would cause a "setState on unmounted
      // component" React warning + a dangling object-URL leak).
      fetchAbortRef.current?.abort()
      fetchAbortRef.current = null
      const el = audioRef.current
      if (el) {
        try {
          el.pause()
          el.removeAttribute('src')
          el.load()
        } catch {}
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [cancelTick])

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isPaused,
    isLoading,
    error,
    progress,
    durationSec,
    elapsedSec,
    currentText,
    chunkIndex,
    totalChunks,
  }
}

// ---------------------------------------------------------------------------
// TTSProvider + useTTSContext — share a single playback instance across
// multiple UIs in the same tree (e.g. reader toolbar button + floating
// player bar). Falls back to a no-op shim when used outside a provider so
// the hook is safe to call from dialog components that don't share state.
//
// The Provider component contains JSX, so it lives in `./tts-provider.tsx`
// (Next.js / ESLint only allow JSX in .tsx files). The hook above is
// pure TypeScript and stays here.
//
// Re-exported for ergonomic single-import usage:
//   import { useTTS, TTSProvider, useTTSContext } from '@/hooks/use-tts'
// ---------------------------------------------------------------------------

export { TTSProvider, useTTSContext, useTTSOrStandalone } from './tts-provider'
