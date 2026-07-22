'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useReader } from '@/components/reader/reader-context'
import { toPersianDigits } from '@/lib/reader/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
  Play,
} from 'lucide-react'

/**
 * The bottom control bar of the reader: prev/next paragraph buttons (with
 * keyboard hints), a slider for jumping between paragraphs (with optional
 * dot navigation on mobile), the auto-scroll toggle (with live countdown),
 * a page counter, the remaining-reading-time estimate, the session timer,
 * a mini progress bar, and a "finish reading" button on the last page.
 *
 * Mobile layout: prev / compact slider / next / auto-scroll. The
 * remaining-time estimate hides on very small screens; the page counter
 * always stays visible so readers always know where they are.
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
    toggleAutoScroll,
    autoScrollActive,
    autoScrollRemaining,
    prefs,
    chromeVisible,
  } = useReader()

  // Page dots — up to 12 dots; when there are more pages we fall back to
  // the slider so we don't render hundreds of tiny dots.
  const showDots = totalPages <= 12
  const dotFill = (i: number) => {
    if (i === currentParagraph) return themeStyle.accent
    if (i < currentParagraph) return themeStyle.accent + '88'
    return themeStyle.border
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
            {/* ---- Mini progress bar (above the controls) ---- */}
            <div
              className="mb-2 h-1 w-full overflow-hidden rounded-full"
              style={{ background: themeStyle.border }}
              role="progressbar"
              aria-valuenow={displayPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="پیشرفت مطالعه"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${displayPercent}%`,
                  background: themeStyle.accent,
                  transition: 'width 120ms linear',
                }}
              />
            </div>

            <div className="mb-1.5 flex items-center justify-between text-[11px] opacity-70">
              <span className="tabular-nums" aria-live="polite">
                چپتر {toPersianDigits(currentParagraph + 1)} از{' '}
                {toPersianDigits(totalPages)}
              </span>
              <div className="flex items-center gap-3">
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
                <span className="tabular-nums">
                  {toPersianDigits(displayPercent)}٪ مطالعه شده
                </span>
              </div>
            </div>
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
                    className="flex h-9 items-center justify-between gap-1 px-1"
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
                        className="flex-1"
                        title={`چپتر ${toPersianDigits(i + 1)}`}
                      >
                        <span
                          className="block h-2 w-full rounded-full transition-[transform,opacity,colors,border-color,background-color]"
                          style={{
                            background: dotFill(i),
                            transform:
                              i === currentParagraph ? 'scaleY(1.4)' : undefined,
                          }}
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
              {/* Auto-scroll toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAutoScroll}
                className="size-11 shrink-0"
                style={
                  autoScrollActive
                    ? {
                        background: themeStyle.accent + '22',
                        color: themeStyle.accent,
                      }
                    : undefined
                }
                title={`ورق‌خودی خودکار هر ${prefs.autoScrollInterval} ثانیه`}
                aria-label="ورق‌خودی خودکار"
                aria-pressed={autoScrollActive}
              >
                {autoScrollActive ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {autoScrollActive && (
                  <span
                    className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums text-white"
                    style={{ background: themeStyle.accent }}
                  >
                    {toPersianDigits(autoScrollRemaining)}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
