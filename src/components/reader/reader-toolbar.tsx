'use client';

import { Button } from '@/components/ui/button';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useReader } from '@/components/reader/reader-context';
import { formatSessionTime } from '@/hooks/reader/use-reading-session-timer';
import { toPersianDigits, type ReaderTheme } from '@/lib/reader/types';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Coffee,
  Contrast,
  Focus,
  Highlighter,
  Languages,
  List as ListIcon,
  Search,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Sun,
  Type,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
    setShowSearch,
    setShowSettings,
    setShowHighlights,
    setShowDictionary,
    setShowChat,
    toggleFocusMode,
    chromeVisible,
    cycleTheme,
    increaseFontSize,
    decreaseFontSize,
    handleShare,
  } = useReader();

  const [moreOpen, setMoreOpen] = useState(false);

  const themeLabel =
    prefs.theme === 'light'
      ? 'روز'
      : prefs.theme === 'sepia'
        ? 'سپیا'
        : prefs.theme === 'dark'
          ? 'شب'
          : 'کنتراست بالا';

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b shadow-sm pt-safe transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity]',
          chromeVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none',
        )}
        style={{ background: themeStyle.bg, borderColor: themeStyle.border }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <a
              href={`/books/${book.slug}`}
              className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-70"
            >
              <ChevronRight className="h-5 w-5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="ms-1 max-w-[120px] truncate text-sm font-bold sm:max-w-xs">
                  {book.title}
                </span>
                {book.author && (
                  <span
                    className="ms-1 max-w-[120px] truncate text-[10px] opacity-90 font-medium sm:max-w-xs"
                    dir="auto"
                  >
                    {book.author}
                  </span>
                )}
              </span>
              <span
                suppressHydrationWarning
                className="hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-block"
                style={{
                  background: themeStyle.accent + '22',
                  color: themeStyle.accent,
                }}
              >
                {`${toPersianDigits(displayPercent)}٪`}
              </span>
              <span
                className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold lg:inline-flex"
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

            {/* ---- TOC / Chapters: Direct book navigation next to title ---- */}
            <ReaderIconButton
              onClick={() => {
                setShowChapters((v) => !v);
                setShowSettings(false);
                setShowHighlights(false);
              }}
              label="فهرست فصل‌ها"
              accent={themeStyle.accent}
              ariaKeyshortcuts="C"
              className="inline-flex"
            >
              <ListIcon className="h-4 w-4" />
              <span className="hidden xl:inline text-xs font-medium">فصل‌ها</span>
            </ReaderIconButton>

            {/* ---- In-book Search: Quick lookup across English & Persian ---- */}
            <ReaderIconButton
              onClick={() => {
                setShowSearch((v) => !v);
                setShowChapters(false);
                setShowSettings(false);
                setShowHighlights(false);
              }}
              label="جستجو در متن کتاب (کلید / یا Ctrl+F)"
              accent={themeStyle.accent}
              ariaKeyshortcuts="/"
              className="inline-flex"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline text-xs font-medium">جستجو</span>
            </ReaderIconButton>
          </div>

          {/* ---- Actions & Tools Area (Categorized Clusters) ---- */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Cluster 1: Language & Translation */}
            <div className="flex items-center gap-0.5">
              <ReaderIconButton
                onClick={() =>
                  update('language', currentLanguage === 'english' ? 'farsi' : 'english')
                }
                label={`${currentLanguage === 'english' ? 'EN' : 'FA'} — تغییر زبان متن (فعلی: ${currentLanguage === 'english' ? 'انگلیسی' : 'فارسی'})`}
                ariaKeyshortcuts="L"
                className="h-9 px-2.5"
              >
                <Languages className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider">
                  {currentLanguage === 'english' ? 'EN' : 'FA'}
                </span>
              </ReaderIconButton>

              <ReaderIconButton
                onClick={() => update('showSubtitles', !prefs.showSubtitles)}
                label="زیرنویس ترجمه فارسی"
                active={prefs.showSubtitles}
                accent={themeStyle.accent}
                ariaKeyshortcuts="T"
                className="h-9 px-2"
              >
                <Type className="h-4 w-4" />
                <span className="hidden lg:inline text-xs font-medium">ترجمه</span>
              </ReaderIconButton>
            </div>

            {/* Divider */}
            <div
              className="hidden sm:block h-4 w-px opacity-25 mx-0.5"
              style={{ background: themeStyle.text }}
            />

            {/* Cluster 2: Study & AI Companion */}
            <div className="hidden md:flex items-center gap-0.5">
              <ReaderIconButton
                onClick={() => {
                  setShowHighlights((v) => !v);
                  setShowSettings(false);
                }}
                label="نشان‌ها و هایلایت‌ها"
                accent={themeStyle.accent}
                ariaKeyshortcuts="H"
                className="h-9 w-9 p-0 justify-center"
              >
                <Highlighter className="h-4 w-4" />
                {pageHlCount > 0 && (
                  <span
                    className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm"
                    style={{ background: themeStyle.accent }}
                  >
                    {toPersianDigits(pageHlCount)}
                  </span>
                )}
              </ReaderIconButton>

              <ReaderIconButton
                onClick={() => {
                  setShowDictionary((v) => !v);
                  setShowSettings(false);
                  setShowHighlights(false);
                  setShowChapters(false);
                }}
                label="دیکشنری و واژه‌نامه (کلید D)"
                accent={themeStyle.accent}
                ariaKeyshortcuts="D"
                className="h-9 w-9 p-0 justify-center"
              >
                <BookOpen className="h-4 w-4" />
              </ReaderIconButton>

              <ReaderIconButton
                onClick={() => setShowChat((v) => !v)}
                label="دستیار هوش مصنوعی"
                accent={themeStyle.accent}
                ariaKeyshortcuts="A"
                className="h-9 w-9 p-0 justify-center"
              >
                <MessageSquare className="h-4 w-4" />
              </ReaderIconButton>
            </div>

            {/* Divider */}
            <div
              className="hidden md:block h-4 w-px opacity-25 mx-0.5"
              style={{ background: themeStyle.text }}
            />

            {/* Cluster 3: Display, Typography & Appearance */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Segmented Font Stepper (Fixed LTR order: [ A- | A+ ] with matching h-9) */}
              <div
                className="flex h-9 items-center rounded-lg border shadow-sm"
                style={{ borderColor: themeStyle.border }}
                dir="ltr"
              >
                <button
                  type="button"
                  onClick={decreaseFontSize}
                  title="کاهش اندازه قلم (A-)"
                  aria-label="کاهش اندازه قلم"
                  className="flex h-full w-8 items-center justify-center rounded-s-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span className="text-[11px] font-bold opacity-75">A-</span>
                </button>
                <div className="h-4 w-px opacity-20" style={{ background: themeStyle.text }} />
                <button
                  type="button"
                  onClick={increaseFontSize}
                  title="افزایش اندازه قلم (A+)"
                  aria-label="افزایش اندازه قلم"
                  className="flex h-full w-8 items-center justify-center rounded-e-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span className="text-xs font-bold">A+</span>
                </button>
              </div>

              <ReaderIconButton
                onClick={cycleTheme}
                label={`تغییر تم (فعلی: ${themeLabel})`}
                accent={themeStyle.accent}
                ariaKeyshortcuts="Shift+T"
                className="h-9 w-9 p-0 justify-center"
              >
                <Contrast className="h-4 w-4" />
              </ReaderIconButton>

              <ReaderIconButton
                onClick={() => {
                  setShowSettings((v) => !v);
                  setShowHighlights(false);
                }}
                label="تنظیمات مطالعه"
                accent={themeStyle.accent}
                ariaKeyshortcuts="S"
                className="h-9 w-9 p-0 justify-center"
              >
                <Settings className="h-4 w-4" />
              </ReaderIconButton>
            </div>

            {/* Divider */}
            <div
              className="hidden md:block h-4 w-px opacity-25 mx-0.5"
              style={{ background: themeStyle.text }}
            />

            {/* Cluster 4: Utility & Mode Actions */}
            <div className="flex items-center gap-0.5">
              <ReaderIconButton
                onClick={handleShare}
                label="اشتراک‌گذاری"
                accent={themeStyle.accent}
                className="hidden md:inline-flex h-9 w-9 p-0 justify-center"
              >
                <Share2 className="h-4 w-4" />
              </ReaderIconButton>

              <ReaderIconButton
                onClick={toggleFocusMode}
                label="حالت تمرکز (تمام‌صفحه)"
                accent={themeStyle.accent}
                ariaKeyshortcuts="F"
                className="hidden sm:inline-flex h-9 w-9 p-0 justify-center"
              >
                <Focus className="h-4 w-4" />
              </ReaderIconButton>

              {/* Mobile overflow trigger */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(true)}
                aria-label="ابزارهای بیشتر"
                title="ابزارهای بیشتر"
                className="md:hidden h-9 w-9"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Mobile overflow Sheet — Categorized for optimal touch UX ---- */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-3xl border-t p-0 pb-safe shadow-2xl overflow-hidden"
          style={{
            background: themeStyle.bg,
            color: themeStyle.text,
            borderColor: themeStyle.border,
          }}
        >
          <SheetTitle className="sr-only">ابزارهای مطالعه</SheetTitle>
          <SheetDescription className="sr-only">
            دسترسی به فصل‌ها، نشان‌ها، دیکشنری، جستجو، هوش مصنوعی، تنظیمات قلم، تم و امکانات دیگر.
          </SheetDescription>

          {/* Top Handle / Pill indicator */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div
              className="h-1.5 w-12 rounded-full opacity-35"
              style={{ background: themeStyle.accent }}
            />
          </div>

          {/* Header */}
          <div
            className="flex shrink-0 items-center justify-between border-b px-5 py-2.5"
            style={{ borderColor: themeStyle.border }}
          >
            <h2 className="text-sm font-bold">ابزارهای مطالعه و تنظیمات</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMoreOpen(false)}
              aria-label="بستن"
              className="h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 p-4">
            {/* Section 1: Appearance & Typography */}
            <div
              className="space-y-2.5 rounded-2xl border p-3"
              style={{ borderColor: themeStyle.border, background: themeStyle.bg }}
            >
              {/* Font Size Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">اندازه قلم متن</span>
                <div
                  className="flex items-center gap-1.5 rounded-xl border px-1.5 py-1"
                  style={{ borderColor: themeStyle.border }}
                  dir="ltr"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseFontSize}
                    className="h-7 w-7 rounded-lg p-0 font-bold"
                    aria-label="کاهش اندازه قلم"
                    title="کاهش اندازه قلم"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[36px] text-center text-xs font-bold tabular-nums">
                    {toPersianDigits(prefs.fontSize)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseFontSize}
                    className="h-7 w-7 rounded-lg p-0 font-bold"
                    aria-label="افزایش اندازه قلم"
                    title="افزایش اندازه قلم"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    id: 'light',
                    label: 'روز',
                    icon: Sun,
                    bg: '#ffffff',
                    text: '#1a1a1a',
                    border: '#e5e5e5',
                  },
                  {
                    id: 'sepia',
                    label: 'سپیا',
                    icon: Coffee,
                    bg: '#f4ecd8',
                    text: '#5b4636',
                    border: '#d9ccb0',
                  },
                  {
                    id: 'dark',
                    label: 'شب',
                    icon: Moon,
                    bg: '#1c1c1e',
                    text: '#f2f2f7',
                    border: '#38383a',
                  },
                  {
                    id: 'high-contrast',
                    label: 'کنتراست',
                    icon: Contrast,
                    bg: '#000000',
                    text: '#ffff00',
                    border: '#555555',
                  },
                ].map((t) => {
                  const isActive = prefs.theme === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update('theme', t.id as ReaderTheme)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-xl border py-2 px-1 text-xs transition-transform active:scale-95',
                        isActive
                          ? 'ring-2 ring-gold-500 font-bold shadow-xs'
                          : 'opacity-80 hover:opacity-100',
                      )}
                      style={{
                        background: t.bg,
                        color: t.text,
                        borderColor: isActive ? themeStyle.accent : t.border,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Quick Study Tools (3-column balanced grid) */}
            <div className="rounded-2xl border p-2" style={{ borderColor: themeStyle.border }}>
              <div className="grid grid-cols-3 gap-1">
                <MoreToolButton
                  icon={<ListIcon className="h-5 w-5" />}
                  label="فصل‌ها"
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => {
                      setShowChapters(true);
                      setShowSettings(false);
                      setShowHighlights(false);
                      setShowDictionary(false);
                      setShowSearch(false);
                    }, 120);
                  }}
                  accent={themeStyle.accent}
                />
                <MoreToolButton
                  icon={<Highlighter className="h-5 w-5" />}
                  label="نشان‌ها"
                  badge={pageHlCount > 0 ? toPersianDigits(pageHlCount) : undefined}
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => {
                      setShowHighlights(true);
                      setShowSettings(false);
                      setShowChapters(false);
                      setShowDictionary(false);
                      setShowSearch(false);
                    }, 120);
                  }}
                  accent={themeStyle.accent}
                />
                <MoreToolButton
                  icon={<BookOpen className="h-5 w-5" />}
                  label="دیکشنری"
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => {
                      setShowDictionary(true);
                      setShowSettings(false);
                      setShowHighlights(false);
                      setShowChapters(false);
                      setShowSearch(false);
                    }, 120);
                  }}
                  accent={themeStyle.accent}
                />
                <MoreToolButton
                  icon={<Search className="h-5 w-5" />}
                  label="جستجو"
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => {
                      setShowSearch(true);
                      setShowChapters(false);
                      setShowSettings(false);
                      setShowHighlights(false);
                      setShowDictionary(false);
                    }, 120);
                  }}
                  accent={themeStyle.accent}
                />
                <MoreToolButton
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="هوش مصنوعی"
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => setShowChat(true), 120);
                  }}
                  accent={themeStyle.accent}
                />
                <MoreToolButton
                  icon={<Focus className="h-5 w-5" />}
                  label="حالت تمرکز"
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => toggleFocusMode(), 120);
                  }}
                  accent={themeStyle.accent}
                />
              </div>
            </div>

            {/* Section 3: Settings & Share (2-column balanced row) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setTimeout(() => {
                    setShowSettings(true);
                    setShowHighlights(false);
                    setShowChapters(false);
                    setShowDictionary(false);
                    setShowSearch(false);
                  }, 120);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-98"
                style={{ borderColor: themeStyle.border }}
              >
                <Settings className="h-4 w-4" style={{ color: themeStyle.accent }} />
                <span className="text-xs font-semibold">تنظیمات کامل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setTimeout(() => handleShare(), 120);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-98"
                style={{ borderColor: themeStyle.border }}
              >
                <Share2 className="h-4 w-4" style={{ color: themeStyle.accent }} />
                <span className="text-xs font-semibold">اشتراک‌گذاری</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
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
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl border border-transparent py-2 px-1 text-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
      aria-label={label}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full transition-transform"
        style={accent ? { background: accent + '1a', color: accent } : undefined}
      >
        {icon}
      </span>
      <span className="text-xs font-medium leading-tight">{label}</span>
      {badge && (
        <span
          className="absolute end-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs"
          style={accent ? { background: accent } : undefined}
        >
          {badge}
        </span>
      )}
    </button>
  );
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
  children: ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  accent?: string;
  ariaKeyshortcuts?: string;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-keyshortcuts={ariaKeyshortcuts}
      className={cn('relative h-9 rounded-lg gap-1.5 px-2.5 transition-colors', className)}
      style={active && accent ? { background: accent + '22', color: accent } : undefined}
    >
      {children}
    </Button>
  );
}
