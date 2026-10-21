'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AudioWaveBars } from '@/components/reader/audio-wave-bars';
import { ReaderAudioControls } from '@/components/reader/reader-audio-controls';
import { chapterSegments, currentChapterIndex } from '@/components/reader/chapter-utils';
import { useReader } from '@/components/reader/reader-context';
import { useTTSContext } from '@/hooks/tts-provider';
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store';
import { toPersianDigits } from '@/lib/reader/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Pause,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { useMemo } from 'react';

const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${toPersianDigits(m)}:${toPersianDigits(s).padStart(2, '۰')}`;
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
    book,
    themeStyle,
    currentParagraph,
    totalPages,
    displayPercent,
    remainingMinutes,
    sessionMinutes,
    isLastPage,
    scrollToParagraph,
    chromeVisible,
  } = useReader();

  // Real printed page numbers from the DB (pageNumber can start above 1,
  // e.g. 3..84) — never display the array index for these.
  const realPage = book.pages[currentParagraph]?.pageNumber ?? currentParagraph + 1;
  const lastRealPage = book.pages[book.pages.length - 1]?.pageNumber ?? totalPages;
  const pageAt = (i: number) => book.pages[i]?.pageNumber ?? i + 1;

  const tts = useTTSContext();
  const audioSpeed = useReaderSettingsStore((state) => state.audioSpeed);
  const setAudioSpeed = useReaderSettingsStore((state) => state.setAudioSpeed);

  // Chapter segments for the nav dropdown; empty when the book has no chapters.
  const chapters = useMemo(() => chapterSegments(book), [book]);
  const chapterIdx = currentChapterIndex(chapters, currentParagraph);
  const activeChapter = chapterIdx >= 0 ? chapters[chapterIdx] : undefined;

  const isAudioActive = Boolean(tts.currentText || tts.isPlaying || tts.isPaused || tts.isLoading);

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.findIndex((s) => Math.abs(s - audioSpeed) < 0.05);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setAudioSpeed(SPEEDS[nextIndex]);
  };

  // Unified Chapter Segments — up to 16 chapters; when there are more we fall back to slider
  const showDots = totalPages <= 16;
  const dotFill = (i: number): React.CSSProperties => {
    if (i === currentParagraph) {
      return {
        background: themeStyle.accent,
        boxShadow: `0 0 10px ${themeStyle.accent}77`,
        transform: 'scaleY(1.4)',
      };
    }
    if (i < currentParagraph) {
      return {
        background: themeStyle.accent + 'aa',
        transform: 'scaleY(1)',
      };
    }
    return {
      background: themeStyle.border,
      transform: 'scaleY(1)',
    };
  };

  return (
    <>
      <div
        className={cn(
          'no-select fixed inset-x-0 bottom-0 z-40 border-t pb-safe shadow-lg transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity]',
          chromeVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none',
        )}
        style={{ background: themeStyle.bg, borderColor: themeStyle.border }}
      >
        <div className="mx-auto max-w-3xl px-3 py-2.5 sm:px-5 sm:py-3">
          <>
            {isAudioActive ? (
              /* =========================================================
                   AUDIO PLAYER MODE (هنگام فعال بودن گوینده صوتی)
                   ========================================================= */
              <div key="audio-mode" className="space-y-2">
                {/* Interactive Audio progress bar with click / scrub support */}
                <div
                  className="group relative cursor-pointer py-1.5 touch-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.width <= 0) return;
                    const isRtl =
                      document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
                    const clickX = e.clientX - rect.left;
                    const ratio = isRtl ? 1 - clickX / rect.width : clickX / rect.width;
                    tts.seekPercent(Math.max(0, Math.min(1, ratio)));
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
                    <span className="font-bold shrink-0" style={{ color: themeStyle.accent }}>
                      صوت صفحه {toPersianDigits(realPage)}
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
                    {tts.isPlaying && <AudioWaveBars count={3} className="h-3" />}
                    <Volume2 className="h-3.5 w-3.5" style={{ color: themeStyle.accent }} />
                  </div>
                </div>

                {/* Audio controls row */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Prev page */}
                  <Button
                    variant="ghost"
                    onClick={() => scrollToParagraph(Math.max(currentParagraph - 1, 0))}
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
                      scrollToParagraph(Math.min(currentParagraph + 1, totalPages - 1))
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
              </div>
            ) : (
              /* =========================================================
                   READING NAVIGATION MODE (حالت عادی ناوبری و مطالعه)
                   ========================================================= */
              <div key="nav-mode" className="space-y-1.5">
                {/* Single Clean Meta Info Header */}
                <div className="flex items-center justify-between text-xs">
                  {activeChapter ? (
                    /* Current chapter dropdown — EN + FA titles, jump on click */
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="group flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 -ms-1.5 text-start transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          aria-label="انتخاب فصل"
                          title="انتخاب فصل"
                        >
                          <span className="flex min-w-0 flex-col leading-tight">
                            <span
                              className="truncate text-xs font-bold"
                              dir="ltr"
                              lang="en"
                              style={{ color: themeStyle.accent }}
                            >
                              {activeChapter.title}
                            </span>
                            {activeChapter.titleFa && (
                              <span
                                className="truncate text-[10px] font-medium opacity-75"
                                dir="rtl"
                                lang="fa"
                              >
                                {activeChapter.titleFa}
                              </span>
                            )}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className="max-h-[60dvh] overflow-y-auto rounded-xl"
                        style={{
                          background: themeStyle.bg,
                          color: themeStyle.text,
                          borderColor: themeStyle.border,
                        }}
                      >
                        <div
                          className="px-3 pb-1.5 pt-2 text-[10px] font-bold opacity-60"
                          dir="rtl"
                        >
                          فصل‌های کتاب
                        </div>
                        {chapters.map((ch, i) => (
                          <DropdownMenuItem
                            key={ch.id}
                            onClick={() => scrollToParagraph(ch.pageIndex)}
                            className="gap-2 rounded-lg px-3 py-2"
                          >
                            <Check
                              className={cn(
                                'h-3.5 w-3.5 shrink-0',
                                i === chapterIdx ? 'opacity-100' : 'opacity-0',
                              )}
                              style={{ color: themeStyle.accent }}
                            />
                            <span className="flex min-w-0 flex-col leading-tight">
                              <span className="truncate text-xs font-bold" dir="ltr" lang="en">
                                {ch.title}
                              </span>
                              {ch.titleFa && (
                                <span
                                  className="truncate text-[10px] font-medium opacity-70"
                                  dir="rtl"
                                  lang="fa"
                                >
                                  {ch.titleFa}
                                </span>
                              )}
                            </span>
                            <span className="ms-auto shrink-0 text-[10px] font-bold opacity-60 tabular-nums">
                              ص{toPersianDigits(ch.startPage)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span
                      className="tabular-nums font-bold"
                      aria-live="polite"
                      style={{ color: themeStyle.accent }}
                    >
                      صفحه {toPersianDigits(realPage)} از {toPersianDigits(lastRealPage)}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-3 text-[11px] font-medium"
                    style={{ color: themeStyle.text }}
                  >
                    {activeChapter && (
                      <span className="tabular-nums font-bold" style={{ color: themeStyle.accent }}>
                        صفحه {toPersianDigits(realPage)} از {toPersianDigits(lastRealPage)}
                      </span>
                    )}
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
                    <span suppressHydrationWarning className="tabular-nums font-bold">
                      {toPersianDigits(displayPercent)}٪ مطالعه شده
                    </span>
                  </div>
                </div>

                {/* Navigation & Unified Segmented Chapter Progress Bar */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => scrollToParagraph(Math.max(currentParagraph - 1, 0))}
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
                        aria-label="انتخاب صفحه"
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={i === currentParagraph}
                            aria-label={`صفحه ${toPersianDigits(pageAt(i))}`}
                            onClick={() => scrollToParagraph(i)}
                            className="group relative flex-1 py-2"
                            title={`صفحه ${toPersianDigits(pageAt(i))}`}
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
                        aria-label="جابه‌جایی بین صفحه‌ها"
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
                      <span className="hidden text-xs font-bold sm:inline">پایان مطالعه</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        scrollToParagraph(Math.min(currentParagraph + 1, totalPages - 1))
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
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
}
