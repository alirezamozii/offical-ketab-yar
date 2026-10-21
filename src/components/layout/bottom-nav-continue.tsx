'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { useLastReadBook } from '@/hooks/reader/use-last-read-book';
import { calculateRingDashOffset, formatReadingPercent } from '@/lib/reader/progress';
import { useEffect, useState } from 'react';

/**
 * Center dock of the bottom-nav — a notched CIRCLE, raised above the
 * floating pill bar (like the classic "Add Funds" pattern): a thick
 * background-colored ring visually cuts it out of the bar so it reads as
 * part of the nav structure, not a floating chip.
 *
 * Three states:
 *  1. Book in progress (percent < 100): its cover + story-style progress
 *     ring, linking to the reader — label «ادامه کتاب».
 *  2. No book started / book finished: the deterministic BOOK OF THE DAY
 *     (day-of-year rotation over /api/books, same spirit as the home
 *     section) — label «کتاب روز».
 *  3. Empty catalog: neutral quick-access circle linking to /library.
 *
 * Centering: absolute at the UL's true center (left-1/2 + negative margin —
 * RTL-safe, no translate), independent of item distribution.
 */

interface SimpleBook {
  slug: string;
  title: string;
  coverFrom: string;
  coverTo: string;
  coverAccent: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
}

/** Deterministic per-day pick — day-of-year rotation over the catalog. */
function pickBookOfTheDay(books: SimpleBook[]): SimpleBook | null {
  if (books.length === 0) return null;
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return books[dayOfYear % books.length] ?? null;
}

export function BottomNavContinue() {
  const { book, loading } = useLastReadBook();
  const [botd, setBotd] = useState<SimpleBook | null>(null);

  const inProgress = !!book && book.percent < 100;

  // Only fetch the book-of-the-day when there is nothing in progress.
  useEffect(() => {
    if (loading || inProgress || botd) return;
    let cancelled = false;
    fetch('/api/books')
      .then((r) => (r.ok ? r.json() : []))
      .then((books: SimpleBook[]) => {
        if (!cancelled) setBotd(pickBookOfTheDay(books));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, inProgress, botd]);

  const circleBase =
    'relative -mt-8 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-4 ring-background shadow-[0_6px_18px_rgba(0,0,0,0.28)] no-callout no-tap-highlight touch-manipulation tap-target motion-safe:active:scale-[0.9] motion-safe:transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  if (loading) {
    return (
      <span className="absolute inset-y-0 left-1/2 -ml-7 flex w-14 justify-center" aria-hidden>
        <span className={circleBase + ' animate-pulse bg-muted'} />
      </span>
    );
  }

  // ─── Book of the day (nothing in progress / finished) ───────────────────
  if (!inProgress) {
    if (!botd) {
      return (
        <span className="absolute inset-y-0 left-1/2 -ml-7 flex w-14 justify-center">
          <Link
            href="/library"
            aria-label="شروع مطالعه — رفتن به کتاب‌ها"
            title="شروع مطالعه"
            className={circleBase + ' border border-border/80 bg-card text-muted-foreground'}
          >
            <BookOpenIcon />
          </Link>
        </span>
      );
    }
    const cover = botd.coverImageUrl || botd.coverImage || null;
    return (
      <span className="absolute inset-y-0 left-1/2 -ml-7 flex w-14 flex-col items-center justify-start">
        <Link
          href={`/books/${botd.slug}`}
          aria-label={`کتاب روز: ${botd.title}`}
          title={`کتاب روز — ${botd.title}`}
          className={circleBase}
          style={{
            background: `linear-gradient(150deg, ${botd.coverFrom} 0%, ${botd.coverTo} 100%)`,
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- decorative 56px cover thumbnail inside the nav dock
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-1 rounded-full border opacity-30"
              style={{ borderColor: botd.coverAccent }}
            />
          )}
          <span aria-hidden className="absolute inset-0 bg-black/20" />
        </Link>
        <DockLabel>کتاب روز</DockLabel>
      </span>
    );
  }

  // ─── Book in progress ────────────────────────────────────────────────────
  const R = 27;
  const { circumference: C, strokeOffset: dashOffset } = calculateRingDashOffset(book.percent, R);

  return (
    <span className="absolute inset-y-0 left-1/2 -ml-7 flex w-14 flex-col items-center justify-start">
      <a
        href={`/books/read/${book.slug}`}
        aria-label={`ادامه مطالعه ${book.title} — ${formatReadingPercent(book.percent)} پیش رفته است`}
        title={`ادامه ${book.title}`}
        className={circleBase}
        style={{
          background: `linear-gradient(150deg, ${book.coverFrom} 0%, ${book.coverTo} 100%)`,
        }}
      >
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- decorative 56px cover thumbnail inside the nav dock
          <img
            src={book.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-1 rounded-full border opacity-30"
            style={{ borderColor: book.coverAccent }}
          />
        )}
        <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play
            aria-hidden
            className="h-5 w-5 fill-white/95 text-white drop-shadow"
            strokeWidth={1.5}
          />
        </span>

        {/* Story-style progress ring — starts at 12 o'clock, fills with progress */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 56 56"
        >
          <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3.5" />
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            stroke="url(#nav-progress-gold)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
          <defs>
            <linearGradient id="nav-progress-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4d35e" />
              <stop offset="100%" stopColor="#d99a1f" />
            </linearGradient>
          </defs>
        </svg>
      </a>
      <DockLabel>ادامه کتاب</DockLabel>
    </span>
  );
}

function DockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none mt-2.5 text-[8px] font-bold leading-none text-foreground/80">
      {children}
    </span>
  );
}

function BookOpenIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}
