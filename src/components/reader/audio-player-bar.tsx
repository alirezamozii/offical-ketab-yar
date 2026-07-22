'use client'

/**
 * AudioPlayerBar — floating bottom bar that shows when audio is playing
 * (or paused while reading) in the professional reader.
 *
 * Layout: [play/pause] [stop] [progress bar with time X:XX / Y:YY]
 *         [truncated "now reading" text] [wave bars indicator].
 *
 * Auto-hides when `currentText` is empty (i.e. no playback). Animated
 * slide-in via framer-motion. Honours `useReducedMotion`.
 *
 * Consumes the shared reader TTS context — must be rendered inside a
 * `<TTSProvider>`. The provider is wired at the `ProfessionalReader`
 * level so the toolbar button and this bar share a single playback
 * instance.
 */

import { Button } from '@/components/ui/button'
import { AudioWaveBars } from '@/components/reader/audio-wave-bars'
import { useTTSContext } from '@/hooks/use-tts'
import { useReader } from '@/components/reader/reader-context'
import { toPersianDigits } from '@/lib/reader/types'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, Play, Square, Volume2 } from 'lucide-react'

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const total = Math.floor(sec)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${toPersianDigits(m)}:${toPersianDigits(s).padStart(2, '۰')}`
}

export function AudioPlayerBar() {
  const tts = useTTSContext()
  const { themeStyle } = useReader()
  const reduceMotion = useReducedMotion()

  const visible = Boolean(
    tts.currentText || tts.isPlaying || tts.isPaused || tts.isLoading,
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-x-0 bottom-20 z-30 mx-auto flex w-[min(640px,calc(100%-1.5rem))] items-center gap-2 rounded-2xl border p-2 shadow-lg backdrop-blur-md sm:gap-3 sm:p-3"
          style={{
            borderColor: themeStyle.accent + '44',
            background: themeStyle.bg + 'f2',
          }}
          role="region"
          aria-label="پخش صدا"
        >
          {/* Play / Pause */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            style={{
              background: themeStyle.accent + '22',
              color: themeStyle.accent,
            }}
            onClick={() => (tts.isPlaying ? tts.pause() : tts.resume())}
            aria-label={tts.isPlaying ? 'توقف موقت پخش' : 'ادامه پخش'}
            disabled={tts.isLoading || (!tts.isPlaying && !tts.isPaused)}
          >
            {tts.isLoading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
            ) : tts.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Stop */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={tts.stop}
            aria-label="توقف پخش"
          >
            <Square className="h-4 w-4" />
          </Button>

          {/* Progress + time */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div
              className="relative h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: themeStyle.border }}
              role="progressbar"
              aria-label="پیشرفت پخش"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((tts.progress || 0) * 100)}
            >
              <div
                className="absolute inset-y-0 right-0 will-change-transform"
                style={{
                  width: `${Math.max(0, Math.min(100, (tts.progress || 0) * 100))}%`,
                  background: themeStyle.accent,
                  transition: 'width 120ms linear',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold tabular-nums">
              <span style={{ color: themeStyle.muted }}>
                {formatTime(tts.elapsedSec)} / {formatTime(tts.durationSec)}
              </span>
              <span className="flex items-center gap-1">
                {tts.isPlaying && <AudioWaveBars count={3} className="h-3" />}
                <Volume2
                  className="h-3 w-3"
                  style={{ color: themeStyle.accent }}
                />
              </span>
            </div>
          </div>

          {/* Now-reading text (truncated) */}
          {tts.currentText && (
            <p
              className="hidden max-w-[40%] truncate text-xs italic sm:block"
              style={{ color: themeStyle.muted }}
              dir="auto"
              title={tts.currentText}
            >
              «{tts.currentText}»
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
