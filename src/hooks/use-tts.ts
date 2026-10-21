'use client';

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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store';
import { toast } from 'sonner';

export type TTSLang = 'en' | 'fa';

export interface WordBoundary {
  part: string;
  start: number; // in ms
  end: number; // in ms
}

export interface UseTTSReturn {
  speak: (text: string, lang?: TTSLang) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  seek: (timeSec: number) => void;
  seekPercent: (ratio: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  durationSec: number;
  elapsedSec: number;
  currentText: string;
  /** 1-based index of the chunk currently playing (for multi-chunk playback). */
  chunkIndex: number;
  /** Total chunks in the current playback queue (1 for short texts). */
  totalChunks: number;
  /** Exact millisecond-aligned word boundaries from the neural engine. */
  wordBoundaries: WordBoundary[];
  /** Index of the word actively being read (-1 if none/idle). */
  activeWordIndex: number;
}

const MAX_CACHE_ENTRIES = 32;

// The /api/tts route caps input at 500 chars per request. Long passages
// (a full reader page) are split into chunks under this limit at sentence
// boundaries and played back-to-back so the user can listen to a whole
// page without manually re-clicking.
const MAX_CHUNK_CHARS = 480;

function cacheKey(text: string, lang: TTSLang, voice: string, speed: number) {
  return `${lang}|${voice}|${speed}|${text}`;
}

interface CachedAudio {
  blob: Blob;
  wordBoundaries: WordBoundary[];
}

/**
 * Split `text` into chunks ≤ `maxChars`, preferring sentence boundaries.
 * Falls back to word boundaries, then to hard character splits. Always
 * returns at least one chunk (the trimmed text itself) for non-empty input.
 */
function splitIntoChunks(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean ? [clean] : [];

  const chunks: string[] = [];
  // Try sentence boundaries first (EN + FA punctuation).
  const sentences = clean.match(/[^.!?؟!]+[.!?؟!]+\s*/g) || [clean];
  let cur = '';
  for (const s of sentences) {
    if (s.length > maxChars) {
      // Flush current chunk first.
      if (cur.trim()) {
        chunks.push(cur.trim());
        cur = '';
      }
      // Sub-split this long sentence at word boundaries.
      const words = s.split(/\s+/);
      let w = '';
      for (const word of words) {
        if ((w + ' ' + word).trim().length > maxChars) {
          if (w.trim()) chunks.push(w.trim());
          w = word;
        } else {
          w = (w + ' ' + word).trim();
        }
      }
      if (w.trim()) chunks.push(w.trim());
      continue;
    }
    if ((cur + s).length <= maxChars) {
      cur += s;
    } else {
      if (cur.trim()) chunks.push(cur.trim());
      cur = s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

function getWordIndexFromCharIndex(text: string, charIndex: number): number {
  const words = text.split(/\s+/);
  let charsCount = 0;
  for (let i = 0; i < words.length; i++) {
    charsCount += words[i].length + 1;
    if (charsCount > charIndex) return i;
  }
  return -1;
}

export function useTTS(): UseTTSReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const cacheRef = useRef<Map<string, CachedAudio>>(new Map());
  const currentKeyRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  // Queue of pending chunks for long-form playback (e.g. a full reader page).
  const queueRef = useRef<string[]>([]);
  const queueLangRef = useRef<TTSLang>('en');
  const totalChunksRef = useRef<number>(0);
  const chunkIndexRef = useRef<number>(0);
  const isFallbackActiveRef = useRef<boolean>(false);
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playNextChunkRef = useRef<(() => void) | null>(null);
  const boundariesRef = useRef<WordBoundary[]>([]);
  const activeWordIndexRef = useRef<number>(-1);
  // AbortController for the in-flight /api/tts fetch. Aborted when a new
  // speak() call supersedes the current one and on unmount — prevents
  // memory leaks + the "setState on unmounted component" React warning.
  const fetchAbortRef = useRef<AbortController | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchPromiseMap = useRef<Map<string, Promise<CachedAudio | null>>>(new Map());
  const [chunkIndex, setChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [wordBoundaries, setWordBoundaries] = useState<WordBoundary[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const audioSpeed = useReaderSettingsStore((state) => state.audioSpeed);

  // Dynamically update playbackRate on active audio element when audioSpeed changes
  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = audioSpeed;
      } catch {}
    }
  }, [audioSpeed]);

  // ---- Lazily create the audio element on the client ----
  const getAudio = useCallback((): HTMLAudioElement => {
    if (typeof window === 'undefined') {
      throw new Error('useTTS can only be used in the browser');
    }
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = 'auto';
      // Modest default; users can still use the OS mixer.
      el.volume = 1;
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  // ---- Stop the rAF loop that updates elapsed time / progress ----
  const cancelTick = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ---- Stop playback immediately + revoke any object URL ----
  const stop = useCallback(() => {
    cancelTick();
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isFallbackActiveRef.current = false;
      fallbackUtteranceRef.current = null;
    }
    // Abort any in-flight /api/tts fetch so its `.then` doesn't fire on a
    // stopped / unmounted instance.
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    prefetchPromiseMap.current.clear();
    queueRef.current = [];
    totalChunksRef.current = 0;
    chunkIndexRef.current = 0;
    boundariesRef.current = [];
    activeWordIndexRef.current = -1;
    setTotalChunks(0);
    setChunkIndex(0);
    setWordBoundaries((prev) => (prev.length === 0 ? prev : []));
    setActiveWordIndex(-1);
    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
        el.currentTime = 0;
        if (el.src) {
          el.removeAttribute('src');
          el.load();
        }
      } catch {}
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    currentKeyRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setElapsedSec(0);
    setDurationSec(0);
    setCurrentText('');
  }, [cancelTick]);

  // ---- Tick loop: drives progress + elapsed time state and exact word boundary highlight ----
  const startTick = useCallback(() => {
    cancelTick();
    let lastUiUpdateMs = 0;
    const loop = () => {
      const el = audioRef.current;
      if (!el) return;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const currentMs = (el.currentTime || 0) * 1000;

      // High-precision word boundary checking in animation frame
      const bounds = boundariesRef.current;
      if (bounds && bounds.length > 0) {
        const foundIndex = bounds.findIndex((w) => currentMs >= w.start && currentMs <= w.end);
        if (foundIndex !== -1 && foundIndex !== activeWordIndexRef.current) {
          activeWordIndexRef.current = foundIndex;
          setActiveWordIndex(foundIndex);
        } else if (foundIndex === -1 && activeWordIndexRef.current !== -1) {
          // Check if between words or still within short gap
          const nextIdx = bounds.findIndex((w) => currentMs < w.start);
          if (nextIdx > 0 && currentMs - bounds[nextIdx - 1].end > 350) {
            activeWordIndexRef.current = -1;
            setActiveWordIndex(-1);
          }
        }
      }

      // Smooth throttled progress/time updates for React state (~4Hz)
      if (now - lastUiUpdateMs >= 200) {
        lastUiUpdateMs = now;
        const dur = Number.isFinite(el.duration) ? el.duration : 0;
        const pos = el.currentTime || 0;
        setElapsedSec(pos);
        setDurationSec(dur);
        setProgress(dur > 0 ? Math.min(1, pos / dur) : 0);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [cancelTick]);

  // ---- Seek audio to specific second position ----
  const seek = useCallback((timeSec: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const clamped = Math.max(0, Math.min(el.duration, timeSec));
    try {
      el.currentTime = clamped;
      setElapsedSec(clamped);
      setProgress(clamped / el.duration);

      // Immediately sync active word to new time
      const currentMs = clamped * 1000;
      const bounds = boundariesRef.current;
      if (bounds && bounds.length > 0) {
        const found = bounds.findIndex((w) => currentMs >= w.start && currentMs <= w.end);
        activeWordIndexRef.current = found;
        setActiveWordIndex(found);
      }
    } catch (e) {
      console.error('[tts] seek error:', e);
    }
  }, []);

  // ---- Seek audio by progress ratio (0 to 1) ----
  const seekPercent = useCallback(
    (ratio: number) => {
      const el = audioRef.current;
      if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      seek(clampedRatio * el.duration);
    },
    [seek],
  );

  // ---- Background chunk prefetching for zero-latency continuous playback ----
  const prefetchSingleChunk = useCallback(
    async (chunkText: string, lang: TTSLang, signal: AbortSignal): Promise<CachedAudio | null> => {
      const { voiceId, audioSpeed } = useReaderSettingsStore.getState();
      const selectedVoice = voiceId.startsWith(lang)
        ? voiceId
        : lang === 'fa'
          ? 'fa-IR-DilaraNeural'
          : 'en-US-AvaMultilingualNeural';
      const key = cacheKey(chunkText, lang, selectedVoice, audioSpeed);

      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key) || null;
      }
      if (prefetchPromiseMap.current.has(key)) {
        return prefetchPromiseMap.current.get(key) || null;
      }

      const promise = (async () => {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunkText,
              lang,
              voice: selectedVoice,
              speed: audioSpeed,
            }),
            signal,
          });
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) return null;

          let boundaries: WordBoundary[] = [];
          const wbHeader = res.headers.get('x-tts-word-boundaries');
          if (wbHeader) {
            try {
              const decoded =
                typeof window !== 'undefined'
                  ? atob(wbHeader)
                  : Buffer.from(wbHeader, 'base64').toString('utf-8');
              const parsedBounds = JSON.parse(decoded);
              if (Array.isArray(parsedBounds)) {
                boundaries = parsedBounds;
              }
            } catch {}
          }

          const blob = await res.blob();
          if (!blob || blob.size === 0) return null;
          const cachedItem: CachedAudio = { blob, wordBoundaries: boundaries };
          cacheRef.current.set(key, cachedItem);
          if (cacheRef.current.size > MAX_CACHE_ENTRIES) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) cacheRef.current.delete(firstKey);
          }
          return cachedItem;
        } catch {
          return null;
        } finally {
          prefetchPromiseMap.current.delete(key);
        }
      })();

      prefetchPromiseMap.current.set(key, promise);
      return promise;
    },
    [],
  );

  const startBackgroundPrefetch = useCallback(
    (chunks: string[], lang: TTSLang) => {
      prefetchAbortRef.current?.abort();
      const ctrl = new AbortController();
      prefetchAbortRef.current = ctrl;

      void (async () => {
        for (const chunk of chunks) {
          if (ctrl.signal.aborted) break;
          await prefetchSingleChunk(chunk, lang, ctrl.signal);
          if (ctrl.signal.aborted) break;
          // Small pause between background chunk downloads to respect rate limit
          await new Promise((r) => setTimeout(r, 350));
        }
      })();
    },
    [prefetchSingleChunk],
  );

  // ---- Fetch a single chunk's audio (cache-aware) and load it into the element ----
  const loadChunk = useCallback(
    async (text: string, lang: TTSLang): Promise<boolean> => {
      const el = getAudio();
      const { voiceId, audioSpeed } = useReaderSettingsStore.getState();
      const selectedVoice = voiceId.startsWith(lang)
        ? voiceId
        : lang === 'fa'
          ? 'fa-IR-DilaraNeural'
          : 'en-US-AvaMultilingualNeural';
      const key = cacheKey(text, lang, selectedVoice, audioSpeed);

      let cached = cacheRef.current.get(key);
      if (!cached && prefetchPromiseMap.current.has(key)) {
        try {
          cached = (await prefetchPromiseMap.current.get(key)) || undefined;
        } catch {}
      }
      let blob: Blob | undefined = cached?.blob;
      let boundaries: WordBoundary[] = cached?.wordBoundaries || [];

      if (!blob) {
        // Abort any previously in-flight fetch
        fetchAbortRef.current?.abort();
        const ctrl = new AbortController();
        fetchAbortRef.current = ctrl;
        let res: Response;
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
          });
        } catch (err) {
          // AbortError is expected on supersession / unmount — don't toast.
          if (err instanceof DOMException && err.name === 'AbortError') {
            return false;
          }
          throw err;
        }
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('application/json')) {
          const j = await res.json().catch(() => ({}));
          const msg = (j && typeof j.error === 'string' && j.error) || 'سرویس صدا در دسترس نیست';
          setError(msg);
          toast.error(msg);
          return false;
        }

        // Extract WordBoundaries from header if present
        const wbHeader = res.headers.get('x-tts-word-boundaries');
        if (wbHeader) {
          try {
            const decoded =
              typeof window !== 'undefined'
                ? atob(wbHeader)
                : Buffer.from(wbHeader, 'base64').toString('utf-8');
            const parsedBounds = JSON.parse(decoded);
            if (Array.isArray(parsedBounds)) {
              boundaries = parsedBounds;
            }
          } catch (e) {
            console.warn('[tts] failed to parse word boundaries header:', e);
          }
        }

        blob = await res.blob();
        if (!blob || blob.size === 0) {
          const msg = 'سرویس صدا در دسترس نیست';
          setError(msg);
          toast.error(msg);
          return false;
        }
        cacheRef.current.set(key, { blob, wordBoundaries: boundaries });
        if (cacheRef.current.size > MAX_CACHE_ENTRIES) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey) cacheRef.current.delete(firstKey);
        }
      }

      boundariesRef.current = boundaries;
      activeWordIndexRef.current = -1;
      setWordBoundaries(boundaries);
      setActiveWordIndex(-1);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      currentKeyRef.current = key;
      el.src = url;
      return true;
    },
    [getAudio],
  );

  // ---- Web Speech API Fallback Player ----
  const playFallback = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        stop();
        return;
      }
      window.speechSynthesis.cancel();
      const { audioSpeed } = useReaderSettingsStore.getState();
      const utterance = new SpeechSynthesisUtterance(text);

      const lang = queueLangRef.current;
      utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = audioSpeed;

      // Select suitable voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.startsWith(lang));
      if (voice) utterance.voice = voice;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          const wordIdx = getWordIndexFromCharIndex(text, e.charIndex);
          activeWordIndexRef.current = wordIdx;
          setActiveWordIndex(wordIdx);
        }
      };

      utterance.onend = () => {
        // Advance chunk queue
        playNextChunkRef.current?.();
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.error('[tts] fallback error:', e);
          stop();
        }
      };
      fallbackUtteranceRef.current = utterance;
      setIsPlaying(true);
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    },
    [stop],
  );

  // ---- Advance to the next queued chunk (if any) ----
  const playNextChunk = useCallback(async (): Promise<void> => {
    const next = queueRef.current.shift();
    if (next == null) {
      // Queue drained — natural end of long-form playback.
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(1);
      setCurrentText('');
      setTotalChunks(0);
      setChunkIndex(0);
      boundariesRef.current = [];
      activeWordIndexRef.current = -1;
      setWordBoundaries([]);
      setActiveWordIndex(-1);
      totalChunksRef.current = 0;
      chunkIndexRef.current = 0;
      isFallbackActiveRef.current = false;
      return;
    }
    chunkIndexRef.current += 1;
    setChunkIndex(chunkIndexRef.current);
    setCurrentText(next);

    // If fallback is already active, play via Web Speech
    if (isFallbackActiveRef.current) {
      playFallback(next);
      return;
    }

    setIsLoading(true);
    const ok = await loadChunk(next, queueLangRef.current);
    if (!ok) {
      // API failed! Fallback to Web Speech API
      isFallbackActiveRef.current = true;
      setIsLoading(false);
      playFallback(next);
      return;
    }
    setIsLoading(false);
    startTick();
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (playErr) {
      console.error('[tts] play failed, trying fallback:', playErr);
      isFallbackActiveRef.current = true;
      playFallback(next);
    }
  }, [loadChunk, playFallback, startTick]);

  // Keep playNextChunkRef updated
  useEffect(() => {
    playNextChunkRef.current = playNextChunk;
  }, [playNextChunk]);

  // ---- Core: speak arbitrary text (auto-chunks if too long) ----
  const speak = useCallback(
    async (text: string, lang: TTSLang = 'en') => {
      const clean = String(text || '').trim();
      if (!clean) return;

      const chunks = splitIntoChunks(clean, MAX_CHUNK_CHARS);
      if (chunks.length === 0) return;

      const { voiceId, audioSpeed } = useReaderSettingsStore.getState();
      const selectedVoice = voiceId.startsWith(lang)
        ? voiceId
        : lang === 'fa'
          ? 'fa-IR-DilaraNeural'
          : 'en-US-AvaMultilingualNeural';

      // If the same single-chunk text is already playing, do nothing.
      if (
        chunks.length === 1 &&
        currentKeyRef.current === cacheKey(chunks[0], lang, selectedVoice, audioSpeed) &&
        audioRef.current &&
        !audioRef.current.paused
      ) {
        return;
      }

      // Stop any current playback before starting a new one.
      const el = getAudio();
      try {
        el.pause();
        el.currentTime = 0;
        if (el.src) {
          el.removeAttribute('src');
          el.load();
        }
      } catch {}
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      queueRef.current = chunks.slice(1); // remaining chunks after the first
      queueLangRef.current = lang;
      totalChunksRef.current = chunks.length;
      chunkIndexRef.current = 0;
      setTotalChunks(chunks.length);
      setChunkIndex(0);
      boundariesRef.current = [];
      activeWordIndexRef.current = -1;
      setWordBoundaries([]);
      setActiveWordIndex(-1);
      setIsPlaying(false);
      setIsPaused(false);
      setError(null);
      setCurrentText(chunks[0]);
      setIsLoading(true);

      // Prefetch upcoming chunks in background so next transitions are instant!
      if (chunks.length > 1) {
        startBackgroundPrefetch(chunks.slice(1), lang);
      }

      const ok = await loadChunk(chunks[0], lang);
      if (!ok) {
        // API failed! Fallback to Web Speech API
        isFallbackActiveRef.current = true;
        setIsLoading(false);
        playFallback(chunks[0]);
        return;
      }
      setIsLoading(false);
      startTick();
      try {
        await el.play();
        setIsPlaying(true);
        setIsPaused(false);
      } catch (playErr) {
        console.error('[tts] play failed, trying fallback:', playErr);
        isFallbackActiveRef.current = true;
        playFallback(chunks[0]);
      }
    },
    [getAudio, loadChunk, playFallback, startTick, startBackgroundPrefetch],
  );

  const pause = useCallback(() => {
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
        setIsPaused(true);
      }
      return;
    }
    const el = audioRef.current;
    if (el && !el.paused) {
      el.pause();
      setIsPlaying(false);
      setIsPaused(true);
      cancelTick();
    }
  }, [cancelTick]);

  const resume = useCallback(() => {
    if (isFallbackActiveRef.current) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
      }
      return;
    }
    const el = audioRef.current;
    if (el && el.paused && el.src) {
      el.play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
          startTick();
        })
        .catch((err) => {
          console.error('[tts] resume failed:', err);
          toast.error('ادامه پخش صدا ناموفق بود.');
        });
    }
  }, [startTick]);

  // ---- Wire <audio> events ----
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onEnded = () => {
      cancelTick();
      // If there are more chunks queued, advance to the next one.
      if (queueRef.current.length > 0) {
        setProgress(0);
        setElapsedSec(0);
        setDurationSec(0);
        // Fire-and-forget — internal errors are toasted inside.
        playNextChunk();
        return;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(1);
      // Reset elapsed so the UI shows the final position briefly.
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      setElapsedSec(d);
      // Clear the "current text" so floating UIs auto-hide.
      // Keep currentKeyRef set so re-speaking the same text re-fetches cleanly.
      setCurrentText('');
      setTotalChunks(0);
      setChunkIndex(0);
      boundariesRef.current = [];
      activeWordIndexRef.current = -1;
      setWordBoundaries([]);
      setActiveWordIndex(-1);
      totalChunksRef.current = 0;
      chunkIndexRef.current = 0;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    const onError = () => {
      cancelTick();
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      setError('پخش صدا با خطا مواجه شد.');
      // Don't toast here — the fetch error path already toasted.
    };

    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [cancelTick, playNextChunk]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      cancelTick();
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = null;
      const el = audioRef.current;
      if (el) {
        try {
          el.pause();
          el.removeAttribute('src');
          el.load();
        } catch {}
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [cancelTick]);

  return useMemo(
    () => ({
      speak,
      stop,
      pause,
      resume,
      seek,
      seekPercent,
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
      wordBoundaries,
      activeWordIndex,
    }),
    [
      speak,
      stop,
      pause,
      resume,
      seek,
      seekPercent,
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
      wordBoundaries,
      activeWordIndex,
    ],
  );
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
