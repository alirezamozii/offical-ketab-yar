'use client'

/**
 * ReaderAudioControls — toolbar button that toggles TTS playback for the
 * current reader page.
 *
 * Renders three visual states:
 *   • Idle     → Volume2 icon, "گوش دادن" tooltip.
 *   • Loading  → Loader2 spinner (animated).
 *   • Playing  → Square icon + animated gold/amber AudioWaveBars.
 *
 * Reads the current page's plain text from the reader context
 * (`currentParagraphPlainText`) and the active language (`currentLanguage`).
 * When the user navigates to a different paragraph, the underlying text
 * changes — the parent effect (in the toolbar wrapper) stops playback so
 * stale audio doesn't keep playing across page turns.
 *
 * Consumes the shared reader TTS context — must be rendered inside a
 * `<TTSProvider>`.
 *
 * Accessibility:
 *   • Single `<button>` per state, real `aria-label`s in Persian.
 *   • `aria-pressed` reflects the playing state.
 *   • Respects `useReducedMotion` for the wave bars.
 */

import { Button } from '@/components/ui/button'
import { AudioWaveBars } from '@/components/reader/audio-wave-bars'
import { useReader } from '@/components/reader/reader-context'
import { useTTSContext } from '@/hooks/use-tts'
import { toPersianDigits } from '@/lib/reader/types'
import { useReducedMotion } from 'framer-motion'
import { Loader2, Square, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ReaderAudioControlsProps {
  /** Override the text to speak (defaults to current page's plain text). */
  text?: string
  /** Override the language (defaults to the reader's current language). */
  lang?: 'en' | 'fa'
  /** Optional className for the button. */
  className?: string
}

export function ReaderAudioControls({
  text,
  lang,
  className,
}: ReaderAudioControlsProps) {
  const tts = useTTSContext()
  const {
    currentParagraphPlainText,
    currentLanguage,
    currentParagraph,
    themeStyle,
  } = useReader()
  const reduceMotion = useReducedMotion()

  const effectiveText = text ?? currentParagraphPlainText()
  const effectiveLang: 'en' | 'fa' = lang ?? (currentLanguage === 'farsi' ? 'fa' : 'en')

  // Track the paragraph we started playback on. When the reader navigates
  // away (currentParagraph changes), auto-stop so stale audio doesn't bleed
  // into the new page. Skipped on first mount (no playback yet).
  const lastParagraphRef = useRef<number>(currentParagraph)
  useEffect(() => {
    if (lastParagraphRef.current !== currentParagraph) {
      if (tts.isPlaying || tts.isPaused) {
        tts.stop()
      }
      lastParagraphRef.current = currentParagraph
    }
  }, [currentParagraph, tts])

  const handleClick = () => {
    if (tts.isPlaying || tts.isPaused) {
      tts.stop()
      return
    }
    if (!effectiveText) return
    void tts.speak(effectiveText, effectiveLang)
  }

  const isBusy = tts.isLoading || tts.isPlaying || tts.isPaused
  const label =
    tts.isLoading
      ? 'در حال آماده‌سازی صدا...'
      : tts.isPlaying
        ? 'توقف پخش'
        : tts.isPaused
          ? 'ادامه پخش'
          : 'گوش دادن به متن'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={tts.isPlaying}
      className={cn('relative gap-1 px-2', className)}
      style={
        isBusy && themeStyle.accent
          ? { background: themeStyle.accent + '22' }
          : undefined
      }
    >
      {tts.isLoading ? (
        <Loader2
          className="h-4 w-4 animate-spin"
          style={{ color: themeStyle.accent }}
          aria-hidden="true"
        />
      ) : tts.isPlaying ? (
        <>
          <Square
            className="h-3.5 w-3.5"
            style={{ color: themeStyle.accent }}
            aria-hidden="true"
          />
          {!reduceMotion && (
            <AudioWaveBars
              count={4}
              className="h-4"
              barClassName="from-gold-500 to-amber-400"
            />
          )}
        </>
      ) : tts.isPaused ? (
        <Volume2
          className="h-4 w-4"
          style={{ color: themeStyle.accent }}
          aria-hidden="true"
        />
      ) : effectiveText ? (
        <Volume2
          className="h-4 w-4"
          aria-hidden="true"
        />
      ) : (
        <VolumeX
          className="h-4 w-4 opacity-40"
          aria-hidden="true"
        />
      )}

      {/* Chunk indicator (e.g. "۲/۵") shown when long-form playback is active. */}
      {tts.totalChunks > 1 && (tts.isPlaying || tts.isLoading) && (
        <span
          className="text-[9px] font-bold tabular-nums opacity-70"
          aria-hidden="true"
        >
          {toPersianDigits(tts.chunkIndex + 1)}/{toPersianDigits(tts.totalChunks)}
        </span>
      )}
    </Button>
  )
}
