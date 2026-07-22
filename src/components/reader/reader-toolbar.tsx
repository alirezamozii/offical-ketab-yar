'use client'

import { Button } from '@/components/ui/button'
import { ReaderAudioControls } from '@/components/reader/reader-audio-controls'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { useReader } from '@/components/reader/reader-context'
import { formatSessionTime } from '@/hooks/reader/use-reading-session-timer'
import { toPersianDigits } from '@/lib/reader/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  Clock,
  Contrast,
  Focus,
  Highlighter,
  Languages,
  List as ListIcon,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Type,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The top toolbar of the reader: back link, session timer, progress %,
 * font A-/A+ buttons, theme toggle, share, and the row of icon buttons
 * (chapters, language, subtitles, highlights, AI chat, settings, focus
 * mode). Animates in/out with the rest of the chrome when `chromeVisible`
 * toggles.
 *
 * Mobile (`md:hidden`): an extra "more" button (MoreHorizontal) opens a
 * bottom Sheet exposing the 7 tools that are hidden on phone-width
 * viewports — chapters, highlights, AI chat, font A-/A+, theme cycle,
 * TTS, share. The desktop toolbar (`hidden md:flex`) is unchanged.
 */
export function ReaderToolbar() {
  const {
    book,
    themeStyle,
    displayPercent,
    sessionSeconds,
    prefs,
    update,
    currentLanguage,
    pageHlCount,
    setShowChapters,
    setShowSettings,
    setShowHighlights,
    setShowChat,
    toggleFocusMode,
    chromeVisible,
    cycleTheme,
    increaseFontSize,
    decreaseFontSize,
    handleShare,
  } = useReader()

  const [moreOpen, setMoreOpen] = useState(false)

  const themeLabel =
    prefs.theme === 'light'
      ? 'روز'
      : prefs.theme === 'sepia'
        ? 'سپیا'
        : prefs.theme === 'dark'
          ? 'شب'
          : 'کنتراست بالا'

  return (
    <>
    <AnimatePresence>
      {chromeVisible && (
        <motion.header
          initial={{ y: -64 }}
          animate={{ y: 0 }}
          exit={{ y: -64 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-x-0 top-0 z-40 flex h-16 items-center border-b shadow-sm pt-safe"
          style={{ background: themeStyle.bg, borderColor: themeStyle.border }}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
            <a
              href={`/books/${book.slug}`}
              className="flex min-w-0 items-center gap-1.5 hover:opacity-70"
            >
              <ChevronRight className="h-5 w-5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="ms-1 max-w-[120px] truncate text-sm font-bold sm:max-w-xs">
                  {book.title}
                </span>
                {book.author && (
                  <span
                    className="ms-1 max-w-[120px] truncate text-[10px] opacity-60 sm:max-w-xs"
                    dir="auto"
                  >
                    {book.author}
                  </span>
                )}
              </span>
              <span
                className="hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-block"
                style={{
                  background: themeStyle.accent + '22',
                  color: themeStyle.accent,
                }}
              >
                {toPersianDigits(displayPercent)}٪
              </span>
              <span
                className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold md:inline-flex"
                style={{
                  background: themeStyle.accent + '15',
                  color: themeStyle.muted,
                }}
                title="زمان مطالعه این جلسه"
              >
                <Clock className="h-3 w-3" />
                {formatSessionTime(sessionSeconds)}
              </span>
            </a>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* ---- Font size quick-adjust (A- / A+) ---- */}
              <ReaderIconButton
                onClick={decreaseFontSize}
                label="کاهش اندازه قلم"
                accent={themeStyle.accent}
                ariaKeyshortcuts="-"
                className="hidden sm:inline-flex"
              >
                <Minus className="h-4 w-4" />
                <span className="text-[10px] font-bold">A</span>
              </ReaderIconButton>
              <ReaderIconButton
                onClick={increaseFontSize}
                label="افزایش اندازه قلم"
                accent={themeStyle.accent}
                ariaKeyshortcuts="+"
                className="hidden sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs font-bold">A</span>
              </ReaderIconButton>

              {/* ---- TTS audio (گوش دادن به متن) ---- */}
              <ReaderAudioControls className="hidden sm:inline-flex" />

              {/* ---- Theme toggle (cycles day → sepia → dark → high-contrast) ---- */}
              <ReaderIconButton
                onClick={cycleTheme}
                label={`تم: ${themeLabel}`}
                accent={themeStyle.accent}
                ariaKeyshortcuts="Shift+T"
                className="hidden sm:inline-flex"
              >
                <Contrast className="h-4 w-4" />
              </ReaderIconButton>

              <ReaderIconButton
                onClick={() => {
                  setShowChapters((v) => !v)
                  setShowSettings(false)
                  setShowHighlights(false)
                }}
                label="فصل‌ها"
                accent={themeStyle.accent}
                ariaKeyshortcuts="C"
                className="hidden md:inline-flex"
              >
                <ListIcon className="h-4 w-4" />
              </ReaderIconButton>
              <ReaderIconButton
                onClick={() =>
                  update(
                    'language',
                    currentLanguage === 'english' ? 'farsi' : 'english',
                  )
                }
                label="تغییر زبان"
                ariaKeyshortcuts="L"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs font-bold">
                  {currentLanguage === 'english' ? 'EN' : 'FA'}
                </span>
              </ReaderIconButton>
              <ReaderIconButton
                onClick={() => update('showSubtitles', !prefs.showSubtitles)}
                label="ترجمه"
                active={prefs.showSubtitles}
                accent={themeStyle.accent}
                ariaKeyshortcuts="T"
              >
                <Type className="h-4 w-4" />
              </ReaderIconButton>
              <ReaderIconButton
                onClick={() => {
                  setShowHighlights((v) => !v)
                  setShowSettings(false)
                }}
                label="نشان‌ها"
                accent={themeStyle.accent}
                ariaKeyshortcuts="H"
                className="hidden md:inline-flex"
              >
                <Highlighter className="h-4 w-4" />
                {pageHlCount > 0 && (
                  <span
                    className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ background: themeStyle.accent }}
                  >
                    {toPersianDigits(pageHlCount)}
                  </span>
                )}
              </ReaderIconButton>
              <ReaderIconButton
                onClick={handleShare}
                label="اشتراک‌گذاری"
                accent={themeStyle.accent}
                className="hidden md:inline-flex"
              >
                <Share2 className="h-4 w-4" />
              </ReaderIconButton>
              <ReaderIconButton
                onClick={() => setShowChat((v) => !v)}
                label="هوش مصنوعی"
                accent={themeStyle.accent}
                ariaKeyshortcuts="A"
                className="hidden md:inline-flex"
              >
                <MessageSquare className="h-4 w-4" />
              </ReaderIconButton>
              <ReaderIconButton
                onClick={() => {
                  setShowSettings((v) => !v)
                  setShowHighlights(false)
                }}
                label="تنظیمات"
                accent={themeStyle.accent}
                ariaKeyshortcuts="S"
              >
                <Settings className="h-4 w-4" />
              </ReaderIconButton>
              <ReaderIconButton
                onClick={toggleFocusMode}
                label="حالت تمرکز"
                accent={themeStyle.accent}
                ariaKeyshortcuts="F"
              >
                <Focus className="h-4 w-4" />
              </ReaderIconButton>

              {/* ---- Mobile overflow trigger — opens a bottom Sheet with the
                  7 tools that are hidden on phone-width viewports. The
                  desktop toolbar shows the inline buttons instead. ---- */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(true)}
                aria-label="ابزارهای بیشتر"
                title="ابزارهای بیشتر"
                className="md:hidden"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>

    {/* ---- Mobile overflow Sheet — bottom drawer with the 7 hidden tools.
         Each tool is a large tap-target button (≥44×44) with a Persian
         label + icon. Tapping a tool runs its action and closes the sheet. */}
    <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 rounded-t-2xl border-t pb-safe"
        style={{ background: themeStyle.bg, color: themeStyle.text, borderColor: themeStyle.border }}
      >
        <SheetTitle className="sr-only">ابزارهای بیشتر</SheetTitle>
        <SheetDescription className="sr-only">
          دسترسی به فصل‌ها، هایلایت‌ها، هوش مصنوعی، تنظیمات قلم، تم، متن‌خوان و اشتراک‌گذاری.
        </SheetDescription>

        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: themeStyle.border }}
        >
          <h2 className="text-base font-bold">ابزارهای بیشتر</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMoreOpen(false)}
            aria-label="بستن"
          >
            <MoreHorizontal className="h-5 w-5 rotate-45" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 p-4">
          <MoreToolButton
            icon={<ListIcon className="h-5 w-5" />}
            label="فصل‌ها"
            onClick={() => {
              setShowChapters((v) => !v)
              setShowSettings(false)
              setShowHighlights(false)
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Highlighter className="h-5 w-5" />}
            label="نشان‌ها"
            badge={pageHlCount > 0 ? toPersianDigits(pageHlCount) : undefined}
            onClick={() => {
              setShowHighlights((v) => !v)
              setShowSettings(false)
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<MessageSquare className="h-5 w-5" />}
            label="هوش مصنوعی"
            onClick={() => {
              setShowChat((v) => !v)
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Settings className="h-5 w-5" />}
            label="تنظیمات"
            onClick={() => {
              setShowSettings((v) => !v)
              setShowHighlights(false)
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Minus className="h-4 w-4" />}
            label="کاهش قلم"
            onClick={() => {
              decreaseFontSize()
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Plus className="h-4 w-4" />}
            label="افزایش قلم"
            onClick={() => {
              increaseFontSize()
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Contrast className="h-5 w-5" />}
            label={`تم: ${themeLabel}`}
            onClick={() => {
              cycleTheme()
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
          <MoreToolButton
            icon={<Share2 className="h-5 w-5" />}
            label="اشتراک"
            onClick={() => {
              handleShare()
              setMoreOpen(false)
            }}
            accent={themeStyle.accent}
          />
        </div>

        {/* TTS gets its own full-width row because it has live state (spinner,
            wave bars, chunk counter) that needs more horizontal room. */}
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: themeStyle.border }}
        >
          <ReaderAudioControls className="w-full justify-center" />
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}

/**
 * Mobile overflow tool button — large tap target (≥44×44), icon on top,
 * label below. Used in the bottom Sheet triggered by the MoreHorizontal
 * button on phone-width viewports.
 */
function MoreToolButton({
  icon,
  label,
  onClick,
  accent,
  badge,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  accent?: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-transparent p-2 text-center text-[11px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 tap-target"
      aria-label={label}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={accent ? { background: accent + '1a', color: accent } : undefined}
      >
        {icon}
      </span>
      <span className="leading-tight">{label}</span>
      {badge && (
        <span
          className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={accent ? { background: accent } : undefined}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

/**
 * Compact ghost button used throughout the reader toolbar. Supports an
 * `active` state (tinted background) and an optional `ariaKeyshortcuts`
 * for discoverability via the `?` help overlay.
 */
export function ReaderIconButton({
  children,
  onClick,
  label,
  active,
  accent,
  ariaKeyshortcuts,
  className,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  active?: boolean
  accent?: string
  ariaKeyshortcuts?: string
  className?: string
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-keyshortcuts={ariaKeyshortcuts}
      className={cn('relative gap-1 px-2', className)}
      style={active && accent ? { background: accent + '22' } : undefined}
    >
      {children}
    </Button>
  )
}
