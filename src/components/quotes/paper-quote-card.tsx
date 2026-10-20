'use client'

import * as React from 'react'
import { BookCover } from '@/components/books/book-cover'
import type { BookListItem } from '@/lib/data'
import {
  type PaperStyle,
  type AspectRatio,
  type HighlightMarker,
  PAPER_STYLES,
  HIGHLIGHT_MARKERS,
} from '@/lib/quotes'
import { toPersianDigits } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { BookOpen, Quote as QuoteIcon, Sparkles } from 'lucide-react'

export interface PaperQuoteCardProps {
  quote: {
    id: string
    text: string
    textFa?: string
    bookTitle?: string
    bookAuthor?: string
    pageNumber?: number
    bookSlug?: string
  }
  book?: BookListItem
  paperStyle?: PaperStyle
  aspectRatio?: AspectRatio
  highlightMarker?: HighlightMarker
  languageMode?: 'bilingual' | 'en' | 'fa'
  fontSizeScale?: number
  showWatermark?: boolean
  className?: string
}

const BACKDROP_GRADIENTS: Record<
  HighlightMarker,
  {
    background: string
    glowColor: string
    watermarkColor: string
    isLight: boolean
  }
> = {
  none: {
    // Elegant luxury luminous white/platinum gradient when no highlight is chosen
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #e2e8f0 100%)',
    glowColor: 'rgba(255, 255, 255, 0.9)',
    watermarkColor: '#475569',
    isLight: true,
  },
  amber: {
    background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.28) 0%, rgba(28, 22, 16, 0.96) 65%, #0c0a09 100%)',
    glowColor: '#f59e0b',
    watermarkColor: 'rgba(255, 255, 255, 0.75)',
    isLight: false,
  },
  emerald: {
    background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.28) 0%, rgba(12, 28, 22, 0.96) 65%, #06120e 100%)',
    glowColor: '#10b981',
    watermarkColor: 'rgba(255, 255, 255, 0.75)',
    isLight: false,
  },
  rose: {
    background: 'radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.28) 0%, rgba(32, 14, 20, 0.96) 65%, #100609 100%)',
    glowColor: '#f43f5e',
    watermarkColor: 'rgba(255, 255, 255, 0.75)',
    isLight: false,
  },
  sky: {
    background: 'radial-gradient(circle at 50% 30%, rgba(14, 165, 233, 0.28) 0%, rgba(14, 24, 38, 0.96) 65%, #060d16 100%)',
    glowColor: '#0ea5e9',
    watermarkColor: 'rgba(255, 255, 255, 0.75)',
    isLight: false,
  },
  purple: {
    background: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.28) 0%, rgba(26, 16, 36, 0.96) 65%, #0e0616 100%)',
    glowColor: '#a855f7',
    watermarkColor: 'rgba(255, 255, 255, 0.75)',
    isLight: false,
  },
}

export const PaperQuoteCard = React.forwardRef<HTMLDivElement, PaperQuoteCardProps>(
  (
    {
      quote,
      book,
      paperStyle = 'kraft-torn',
      aspectRatio = 'auto',
      highlightMarker = 'amber',
      languageMode = 'bilingual',
      fontSizeScale = 1,
      showWatermark = true,
      className,
    },
    ref,
  ) => {
    const config = PAPER_STYLES[paperStyle] || PAPER_STYLES['kraft-torn']
    const marker =
      HIGHLIGHT_MARKERS.find((m) => m.id === highlightMarker) ||
      HIGHLIGHT_MARKERS[0]

    const backdrop = BACKDROP_GRADIENTS[highlightMarker] || BACKDROP_GRADIENTS.amber

    const hasEn = languageMode !== 'fa' && Boolean(quote.text)
    const hasFa = languageMode !== 'en' && Boolean(quote.textFa)

    // Compute text length to calculate smart auto-scaling factor
    const totalChars =
      (hasEn ? quote.text.length : 0) +
      (hasFa && quote.textFa ? quote.textFa.length : 0)
    const isBilingual = hasEn && hasFa

    // Smart adaptive scale factor — generous and bold
    let autoScale = 1
    if (aspectRatio === 'square') {
      if (totalChars > 220 || (isBilingual && totalChars > 150)) autoScale = 0.84
      else if (totalChars > 140 || (isBilingual && totalChars > 90)) autoScale = 0.92
      else autoScale = 1.0
    } else if (aspectRatio === 'banner') {
      if (totalChars > 220 || (isBilingual && totalChars > 150)) autoScale = 0.80
      else if (totalChars > 140 || (isBilingual && totalChars > 90)) autoScale = 0.88
      else autoScale = 0.96
    } else if (aspectRatio === 'story') {
      if (totalChars > 320) autoScale = 0.90
      else if (totalChars > 200) autoScale = 0.98
      else autoScale = 1.06
    } else {
      // auto
      autoScale = 1.05
    }

    const effectiveScale = fontSizeScale * autoScale

    // Canvas Frame aspect styling — uncompromised design dimensions for HD preview & export
    const frameClasses = cn(
      'relative flex flex-col items-center overflow-hidden transition-all duration-300 rounded-3xl shadow-2xl shrink-0 my-auto',
      {
        'w-[380px] h-[675px] max-w-[380px] min-h-[675px] p-5 justify-between': aspectRatio === 'story',
        'w-[440px] h-[440px] max-w-[440px] min-h-[440px] p-5 justify-center': aspectRatio === 'square',
        'w-[580px] h-[326px] max-w-[580px] min-h-[326px] p-4.5 justify-center': aspectRatio === 'banner',
        'w-[440px] min-h-[320px] max-w-[440px] p-5 justify-center': aspectRatio === 'auto',
      },
      className,
    )

    // Paper inner container style
    const isNotebook = paperStyle === 'notebook'

    return (
      <div
        ref={ref}
        className={frameClasses}
        data-quote-card="true"
        style={{
          background: backdrop.background,
          color: backdrop.isLight ? '#0f172a' : '#ffffff',
        }}
      >
        {/* Subtle background glow matching highlight color */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${backdrop.glowColor}, transparent 70%)`,
          }}
        />

        {/* Top Story Header in 9:16 vertical mode */}
        {aspectRatio === 'story' && (
          <div
            className="relative z-10 w-full flex items-center justify-between px-2 pt-0.5 pb-2 text-xs font-medium opacity-80 shrink-0 whitespace-nowrap select-none"
            style={{ color: backdrop.watermarkColor }}
          >
            <div className="flex items-center gap-1 font-bold whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>کوت روز</span>
            </div>
            <span className="text-[11px] opacity-75 font-semibold whitespace-nowrap" dir="ltr">
              bookzi.ir
            </span>
          </div>
        )}

        {/* Paper Element Wrapper */}
        <div
          className="relative w-full max-w-[94%] transition-all duration-300 select-none z-10 my-auto shadow-2xl rounded-2xl sm:rounded-3xl"
        >
          {/* Main Paper Body with Clean Aesthetic Styling */}
          <div
            className={cn(
              'relative z-10 flex flex-col w-full overflow-hidden transition-colors duration-300 rounded-2xl sm:rounded-3xl border shadow-xl',
              {
                'p-5 sm:p-6 pl-10 sm:pl-12': isNotebook,
                'p-5 sm:p-6': !isNotebook,
              },
            )}
            style={{
              backgroundColor: config.previewColor,
              color: config.textColor,
              borderColor: config.borderColor,
              backgroundImage: isNotebook
                ? 'repeating-linear-gradient(transparent, transparent 24px, rgba(148,163,184,0.35) 25px)'
                : undefined,
            }}
          >
            {/* Lined Notebook Margin & Holes */}
            {isNotebook && (
              <>
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 left-8 sm:left-9 w-[1.5px] bg-rose-400/60"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-2.5 sm:left-3 top-5 h-3.5 w-3.5 rounded-full bg-stone-900/90 shadow-inner"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-stone-900/90 shadow-inner"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-2.5 sm:left-3 bottom-5 h-3.5 w-3.5 rounded-full bg-stone-900/90 shadow-inner"
                />
              </>
            )}

            {/* Paper Content Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <QuoteIcon
                  className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-75 shrink-0"
                  style={{ color: config.textColor }}
                />
                <span
                  className="text-xs font-extrabold tracking-wider uppercase opacity-80"
                  style={{ color: config.textColor }}
                >
                  برشی از کتاب
                </span>
              </div>
              {quote.pageNumber && (
                <span
                  className="text-xs font-semibold opacity-70"
                  style={{ color: config.subTextColor }}
                >
                  صفحه {toPersianDigits(quote.pageNumber)}
                </span>
              )}
            </div>

            {/* Main Quote Text Body */}
            <div className="relative z-10 space-y-2.5 my-2">
              {hasEn && (
                <blockquote
                  dir="ltr"
                  className="font-serif font-medium leading-relaxed tracking-normal transition-all"
                  style={{
                    fontSize: `${1.22 * effectiveScale}rem`,
                    lineHeight: 1.55,
                    color: config.textColor,
                  }}
                >
                  <span
                    className="rounded-md px-1.5 py-0.5 box-decoration-clone"
                    style={{
                      backgroundColor: marker.bg,
                      boxShadow:
                        marker.id !== 'none'
                          ? `0 0 0 2.5px ${marker.bg}`
                          : undefined,
                    }}
                  >
                    “{quote.text}”
                  </span>
                </blockquote>
              )}

              {hasFa && (
                <p
                  dir="rtl"
                  className="leading-relaxed font-semibold transition-all"
                  style={{
                    fontSize: `${1.04 * effectiveScale}rem`,
                    lineHeight: 1.6,
                    color: hasEn ? config.subTextColor : config.textColor,
                  }}
                >
                  {quote.textFa}
                </p>
              )}
            </div>

            {/* Book Attribution Footer */}
            <div className="relative z-10 mt-3.5 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {book ? (
                  <div className="h-10 w-7.5 shrink-0 overflow-hidden rounded-md shadow-xs ring-1 ring-black/15">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      from={book.coverFrom}
                      imageUrl={book.coverImageUrl || book.coverImage || undefined}
                      blurhash={book.coverBlurhash || undefined}
                      to={book.coverTo}
                      accent={book.coverAccent}
                      size="sm"
                    />
                  </div>
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-80 border border-black/5"
                    style={{ background: 'rgba(0,0,0,0.05)' }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: config.textColor }} />
                  </span>
                )}
                <div className="min-w-0">
                  <p
                    className="font-extrabold text-xs sm:text-sm leading-tight truncate"
                    dir="ltr"
                    style={{ color: config.textColor }}
                  >
                    {quote.bookTitle || book?.title || 'Bookzi'}
                  </p>
                  <p
                    className="text-xs opacity-75 truncate mt-0.5"
                    dir="ltr"
                    style={{ color: config.subTextColor }}
                  >
                    {quote.bookAuthor || book?.author || ''}
                  </p>
                </div>
              </div>

              {showWatermark && (
                <div className="flex items-center gap-1 opacity-60 shrink-0">
                  <span
                    className="text-[10px] sm:text-xs font-bold tracking-tight uppercase"
                    style={{ color: config.textColor }}
                  >
                    Bookzi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Story Footer Watermark */}
        {aspectRatio === 'story' && showWatermark && (
          <div
            className="relative z-10 w-full flex items-center justify-center pt-3 pb-1 shrink-0 select-none"
            style={{ color: backdrop.watermarkColor }}
          >
            <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-semibold tracking-wide">
              <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
              <span className="whitespace-nowrap font-bold">بوکزی</span>
              <span className="opacity-50" aria-hidden="true">-</span>
              <span dir="ltr" className="whitespace-nowrap font-medium text-[11px] tracking-normal opacity-90">
                bookzi.ir
              </span>
            </div>
          </div>
        )}
      </div>
    )
  },
)

PaperQuoteCard.displayName = 'PaperQuoteCard'
