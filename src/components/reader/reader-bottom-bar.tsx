'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { AudioWaveBars } from '@/components/reader/audio-wave-bars'
import { ReaderAudioControls } from '@/components/reader/reader-audio-controls'
import { useReader } from '@/components/reader/reader-context'
import { useTTSContext } from '@/hooks/tts-provider'
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store'
import { toPersianDigits } from '@/lib/reader/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Square,
  Volume2,
} from 'lucide-react'

const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2]

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const total = Math.floor(sec)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${toPersianDigits(m)}:${toPersianDigits(s).padStart(2, '۰')}`
}

/**
 * Unified bottom control bar of the reader:
 *  1. Navigation Mode (default): Prev/next paragraph buttons, chapter slider/dots,
 *     reading progress, remaining time, auto-scroll toggle.
 *  2. Audio Mode (when TTS is active): Seamlessly morphs into a dedicated audio player
 *     with play/pause, time progress, speed control, stop, and previous/next paragraph navigation.
 */
export function ReaderBottomBar() {
  const {
    themeStyle,
    currentParagraph,
    totalPages,
    displayPercent,
    remainingMinutes,
    sessionMinutes,
    isLastPage,
    scrollToParagraph,
    chromeVisible,
  } = useReader()

  const tts = useTTSContext()
  const audioSpeed = useReaderSettingsStore((state) => state.audioSpeed)
  const setAudioSpeed = useReaderSettingsStore((state) => state.setAudioSpeed)

  const isAudioActive = Boolean(
    tts.currentText || tts.isPlaying || tts.isPaused || tts.isLoading,
  )

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.findIndex((s) => Math.abs(s - audioSpeed) < 0.05)
    const nextIndex = (currentIndex + 1) % SPEEDS.length
    setAudioSpeed(SPEEDS[nextIndex])
  }

  // Unified Chapter Segments — up to 16 chapters; when there are more we fall back to slider
  const showDots = totalPages <= 16
  const dotFill = (i: number): React.CSSProperties => {
    if (i === currentParagraph) {
      return {
        background: themeStyle.accent,
        boxShadow: `0 0 10px ${themeStyle.accent}77`,
        transform: 'scaleY(1.4)',
      }
    }
    if (i < currentParagraph) {
      return {
        background: themeStyle.accent + 'aa',
        transform: 'scaleY(1)',
      }
    }
    return {
      background: themeStyle.border,
      transform: 'scaleY(1)',
    }
  }

  return (
    <AnimatePresence>
      {chromeVisible && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.25 }}
          className="no-select absolute inset-x-0 bottom-0 z-40 border-t pb-safe shadow-lg"
          style={{ background: themeStyle.bg, borderColor: themeStyle.border }}
        >
          <div className="mx-auto max-w-3xl px-3 py-2.5 sm:px-5 sm:py-3">
            <AnimatePresence mode="wait">
              {isAudioActive ? (
                /* =========================================================
                   AUDIO PLAYER MODE (هنگام فعال بودن گوینده صوتی)
                   ========================================================= */
                <motion.div
                  key="audio-mode"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {/* Interactive Audio progress bar with click / scrub support */}
                  <div
                    className="group relative cursor-pointer py-1.5 touch-none"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      if (rect.width <= 0) return
                      const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl'
                      const clickX = e.clientX - rect.left
                      const ratio = isRtl ? 1 - clickX / rect.width : clickX / rect.width
                      tts.seekPercent(Math.max(0, Math.min(1, ratio)))
                    }}
                    role="slider"
                    aria-label="جابه‌جایی در زمان پخش صدا"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((tts.progress || 0) * 100)}
                  >
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full transition-all group-hover:h-2"
                      style={{ background: themeStyle.border }}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-75"
                        style={{
                          width: `${Math.max(0, Math.min(100, (tts.progress || 0) * 100))}%`,
                          background: themeStyle.accent,
                        }}
                      />
                    </div>
                  </div>

                  {/* Audio meta row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="font-bold shrink-0"
                        style={{ color: themeStyle.accent }}
                      >
                        صوت چپتر {toPersianDigits(currentParagraph + 1)}
                      </span>
                      {tts.currentText && (
                        <span
                          className="hidden max-w-[220px] truncate text-[11px] opacity-70 italic sm:inline md:max-w-xs"
                          dir="auto"
                          title={tts.currentText}
                        >
                          «{tts.currentText}»
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 tabular-nums font-medium opacity-80">
                      <span>
                        {formatTime(tts.elapsedSec)} / {formatTime(tts.durationSec)}
                      </span>
                      {tts.isPlaying && (
                        <AudioWaveBars count={3} className="h-3" />
                      )}
                      <Volume2
                        className="h-3.5 w-3.5"
                        style={{ color: themeStyle.accent }}
                      />
                    </div>
                  </div>

                  {/* Audio controls row */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {/* Prev page */}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        scrollToParagraph(Math.max(currentParagraph - 1, 0))
                      }
                      disabled={currentParagraph === 0}
                      size="icon"
                      aria-label="پاراگراف قبل"
                      title="پاراگراف قبل"
                      className="size-11 shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {/* Main Audio Controls Center */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Stop & return to reading mode */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={tts.stop}
                        className="size-10 shrink-0 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                        title="توقف پخش و بازگشت به نوار ناوبری"
                        aria-label="توقف پخش"
                      >
                        <Square className="h-4 w-4" />
                      </Button>

                      {/* Play / Pause / Loading button */}
                      <Button
                        type="button"
                        size="icon"
                        className="size-11 shrink-0 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95"
                        style={{
                          background: themeStyle.accent,
                          color: '#ffffff',
                        }}
                        onClick={() => (tts.isPlaying ? tts.pause() : tts.resume())}
                        aria-label={tts.isPlaying ? 'توقف موقت پخش' : 'ادامه پخش'}
                        disabled={tts.isLoading || (!tts.isPlaying && !tts.isPaused)}
                      >
                        {tts.isLoading ? (
                          <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                            aria-hidden="true"
                          />
                        ) : tts.isPlaying ? (
                          <Pause className="h-5 w-5 fill-current" />
                        ) : (
                          <Play className="h-5 w-5 fill-current ms-0.5" />
                        )}
                      </Button>

                      {/* Speed toggle */}
                      <button
                        type="button"
                        onClick={cycleSpeed}
                        className="flex h-9 shrink-0 items-center justify-center rounded-xl border px-2.5 text-xs font-bold tabular-nums transition-transform active:scale-95 hover:opacity-90 shadow-sm"
                        style={{
                          borderColor: themeStyle.accent + '44',
                          background: themeStyle.accent + '18',
                          color: themeStyle.accent,
                        }}
                        title="تغییر سرعت پخش"
                        aria-label={`تغییر سرعت پخش، سرعت فعلی ${audioSpeed} برابر`}
                      >
                        {toPersianDigits(audioSpeed)}×
                      </button>
                    </div>

                    {/* Next page */}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        scrollToParagraph(
                          Math.min(currentParagraph + 1, totalPages - 1),
                        )
                      }
                      disabled={currentParagraph === totalPages - 1}
                      size="icon"
                      aria-label="پاراگراف بعد"
                      title="پاراگراف بعد"
                      className="size-11 shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* =========================================================
                   READING NAVIGATION MODE (حالت عادی ناوبری و مطالعه)
                   ========================================================= */
                <motion.div
                  key="nav-mode"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  {/* Single Clean Meta Info Header */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className="tabular-nums font-bold"
                      aria-live="polite"
                      style={{ color: themeStyle.accent }}
                    >
                      چپتر {toPersianDigits(currentParagraph + 1)} از{' '}
                      {toPersianDigits(totalPages)}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: themeStyle.text }}>
                      <span
                        className="hidden items-center gap-1 sm:inline-flex"
                        title="زمان مطالعه این جلسه"
                      >
                        <Clock className="h-3 w-3" />
                        {toPersianDigits(sessionMinutes)} دقیقه مطالعه
                      </span>
                      {remainingMinutes > 0 && (
                        <span
                          className="hidden items-center gap-1 sm:inline-flex"
                          title="زمان تخمینی باقی‌مانده"
                        >
                          {toPersianDigits(remainingMinutes)} دقیقه باقی‌مانده
                        </span>
                      )}
                      <span className="tabular-nums font-bold">
                        {toPersianDigits(displayPercent)}٪ مطالعه شده
                      </span>
                    </div>
                  </div>

                  {/* Navigation & Unified Segmented Chapter Progress Bar */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        scrollToParagraph(Math.max(currentParagraph - 1, 0))
                      }
                      disabled={currentParagraph === 0}
                      size="icon"
                      aria-label="صفحه قبل"
                      aria-keyshortcuts="→ Shift+Space"
                      title="صفحه قبل (→ یا Shift+Space)"
                      className="size-11 shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      {showDots ? (
                        <div
                          className="flex h-10 items-center justify-between gap-1.5 px-1"
                          role="tablist"
                          aria-label="انتخاب چپتر"
                        >
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              role="tab"
                              aria-selected={i === currentParagraph}
                              aria-label={`چپتر ${toPersianDigits(i + 1)}`}
                              onClick={() => scrollToParagraph(i)}
                              className="group relative flex-1 py-2"
                              title={`چپتر ${toPersianDigits(i + 1)}`}
                            >
                              <span
                                className="block h-2 w-full rounded-full transition-all duration-200 group-hover:h-2.5"
                                style={dotFill(i)}
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Slider
                          value={[currentParagraph]}
                          max={Math.max(totalPages - 1, 1)}
                          step={1}
                          onValueChange={(v) => scrollToParagraph(v[0])}
                          aria-label="جابه‌جایی بین چپترها"
                        />
                      )}
                    </div>
                    {isLastPage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToParagraph(0)}
                        className="shrink-0 gap-1.5 px-3"
                        style={{
                          background: themeStyle.accent + '22',
                          color: themeStyle.accent,
                        }}
                        aria-label="پایان مطالعه — بازگشت به ابتدا"
                        title="پایان مطالعه"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden text-xs font-bold sm:inline">
                          پایان مطالعه
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          scrollToParagraph(
                            Math.min(currentParagraph + 1, totalPages - 1),
                          )
                        }
                        disabled={currentParagraph === totalPages - 1}
                        size="icon"
                        aria-label="صفحه بعد"
                        aria-keyshortcuts="← Space"
                        title="صفحه بعد (← یا Space)"
                        className="size-11 shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Audio Listen Trigger Button (انتقال صوت از بالا به نوار پایین) */}
                    <ReaderAudioControls className="size-11 shrink-0" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
