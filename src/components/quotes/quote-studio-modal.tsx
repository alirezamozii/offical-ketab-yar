'use client'

import * as React from 'react'
import { toPng, toBlob } from 'html-to-image'
import { toast } from 'sonner'
import {
  Check,
  Copy,
  Download,
  Highlighter,
  Layers,
  Layout,
  Loader2,
  Minus,
  Plus,
  Share2,
  Sparkles,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BookListItem } from '@/lib/data'
import {
  type PaperStyle,
  type AspectRatio,
  type HighlightMarker,
  PAPER_STYLES,
  ASPECT_RATIOS,
  HIGHLIGHT_MARKERS,
} from '@/lib/quotes'
import { toPersianDigits } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { PaperQuoteCard } from './paper-quote-card'

export interface QuoteStudioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: {
    id: string
    text: string
    textFa?: string
    pageNumber?: number
    bookSlug?: string
    bookTitle?: string
    bookAuthor?: string
    highlightColor?: string
  } | null
  book?: BookListItem
}

const AVAILABLE_PAPERS: PaperStyle[] = [
  'kraft',
  'white',
  'notebook',
  'sepia',
  'obsidian',
  'minimal',
]

export function QuoteStudioModal({
  open,
  onOpenChange,
  quote,
  book,
}: QuoteStudioModalProps) {
  // Determine initial highlight marker from quote metadata if available
  const initialMarker: HighlightMarker = React.useMemo(() => {
    if (!quote?.highlightColor) return 'amber'
    const color = quote.highlightColor.toLowerCase()
    if (color.includes('emerald') || color.includes('green')) return 'emerald'
    if (color.includes('rose') || color.includes('pink') || color.includes('red')) return 'rose'
    if (color.includes('sky') || color.includes('blue')) return 'sky'
    if (color.includes('purple') || color.includes('violet')) return 'purple'
    return 'amber'
  }, [quote?.highlightColor])

  const [paperStyle, setPaperStyle] = React.useState<PaperStyle>('kraft')
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>('story')
  const [highlightMarker, setHighlightMarker] = React.useState<HighlightMarker>(initialMarker)
  const [languageMode, setLanguageMode] = React.useState<'bilingual' | 'en' | 'fa'>('bilingual')
  const [fontSizeScale, setFontSizeScale] = React.useState<number>(1)
  const showWatermark = true
  const [isExporting, setIsExporting] = React.useState<boolean>(false)
  const [copied, setCopied] = React.useState<boolean>(false)
  const [mobileTab, setMobileTab] = React.useState<'ratio' | 'paper' | 'color' | 'text'>('ratio')

  const cardRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [stageDimensions, setStageDimensions] = React.useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  })

  // Measure preview stage to dynamically fit card without squeezing internal layout
  React.useEffect(() => {
    if (!stageRef.current) return
    let rafId: number
    const updateDimensions = () => {
      if (stageRef.current) {
        const { clientWidth, clientHeight } = stageRef.current
        if (clientWidth > 0 && clientHeight > 0) {
          rafId = requestAnimationFrame(() => {
            setStageDimensions((prev) => {
              if (prev.width === clientWidth && prev.height === clientHeight) return prev
              return { width: clientWidth, height: clientHeight }
            })
          })
        }
      }
    }
    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(stageRef.current)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [open])

  const targetWidth = aspectRatio === 'banner' ? 580 : aspectRatio === 'story' ? 380 : 440
  const targetHeight = aspectRatio === 'banner' ? 326 : aspectRatio === 'story' ? 675 : 440

  const paddingOffset = 24
  const availableW = Math.max(100, stageDimensions.width - paddingOffset)
  const availableH = Math.max(100, stageDimensions.height - paddingOffset)

  const previewScale = Math.min(1, availableW / targetWidth, availableH / targetHeight)

  // Sync initial marker when quote changes
  React.useEffect(() => {
    if (quote?.highlightColor) {
      setHighlightMarker(initialMarker)
    }
  }, [quote, initialMarker])

  if (!quote) return null

  // ---------------------------------------------------------------------------
  // Export Handlers
  // ---------------------------------------------------------------------------

  const getExportFilename = () => {
    const slug = quote.bookSlug || 'quote'
    const date = new Date().toISOString().slice(0, 10)
    return `bookzi-${slug}-${date}.png`
  }

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return
    setIsExporting(true)
    const toastId = toast.loading('در حال پردازش و ساخت عکس با کیفیت بالا...')

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }
      await new Promise((r) => setTimeout(r, 150))

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 0.98,
      })

      const link = document.createElement('a')
      link.download = getExportFilename()
      link.href = dataUrl
      link.click()

      toast.success('تصویر کوت با کیفیت بالا دانلود شد', { id: toastId })
    } catch (err) {
      console.error('Export error:', err)
      toast.error('خطا در ذخیره تصویر. لطفاً مجدداً تلاش فرمایید.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyImage = async () => {
    if (!cardRef.current || isExporting) return
    setIsExporting(true)
    const toastId = toast.loading('در حال آماده‌سازی تصویر برای کپی...')

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }
      await new Promise((r) => setTimeout(r, 150))
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
      })

      if (blob && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('تصویر در کلیپ‌بورد کپی شد (آماده پیست در تلگرام و چت)', {
          id: toastId,
        })
      } else {
        throw new Error('ClipboardItem not supported')
      }
    } catch {
      toast.error('امکان کپی خودکار تصویر در این مرورگر وجود ندارد، از دکمه دانلود استفاده فرمایید.', {
        id: toastId,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (!cardRef.current || isExporting) return

    const shareText = `“${quote.text}”\n\n${quote.textFa ? `${quote.textFa}\n\n` : ''}📚 ${quote.bookTitle || ''} ${quote.bookAuthor ? `— ${quote.bookAuthor}` : ''}\n\n📖 مطالعه در بوکزی (Bookzi)`

    if (typeof navigator !== 'undefined' && navigator.canShare) {
      setIsExporting(true)
      const toastId = toast.loading('در حال ایجاد تصویر جهت اشتراک‌گذاری...')
      try {
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready
        }
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
        })
        if (blob) {
          const file = new File([blob], getExportFilename(), { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `کوت از کتاب ${quote.bookTitle || ''}`,
              text: shareText,
              files: [file],
            })
            toast.dismiss(toastId)
            setIsExporting(false)
            return
          }
        }
      } catch {
        /* fallback */
      } finally {
        setIsExporting(false)
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `کوت از کتاب ${quote.bookTitle || ''}`,
          text: shareText,
        })
        return
      } catch {
        /* user cancelled */
      }
    }

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('متن کوت با موفقیت کپی شد')
    } catch {
      toast.error('خطا در کپی متن')
    }
  }

  const handleCopyText = async () => {
    const shareText = `“${quote.text}”\n\n${quote.textFa ? `${quote.textFa}\n\n` : ''}📚 ${quote.bookTitle || ''} ${quote.bookAuthor ? `— ${quote.bookAuthor}` : ''}\n\n📖 بوکزی (Bookzi)`
    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('متن کوت کپی شد')
    } catch {
      toast.error('خطا در کپی متن')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: 'none',
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          borderRadius: 0,
        }}
        className="!fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !transform-none !w-screen !max-w-none !h-screen !max-h-none !rounded-none !border-0 !p-0 !m-0 !gap-0 !overflow-hidden flex flex-col bg-background z-[160]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>استودیوی طراحی کارت کوت</DialogTitle>
          <DialogDescription>
            سفارشی‌سازی ظاهر کاغذ، هایلایت، ابعاد و دانلود با کیفیت بالا برای استوری و تلگرام.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Top Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card px-5 sm:px-8 h-16 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-none text-foreground">
                استودیو طراحی کوت
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                طراحی عکس حرفه‌ای برای استوری اینستاگرام، تلگرام و شبکه‌های اجتماعی
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="بستن استودیو"
            className="h-10 w-10 rounded-full bg-muted/60 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] overflow-hidden bg-background">
          {/* Left/Center Stage: Preview Canvas (Responsive & non-scrolling on mobile) */}
          <div
            ref={stageRef}
            className="relative h-[42vh] sm:h-[48vh] lg:h-full w-full overflow-hidden bg-stone-950 flex items-center justify-center p-3 border-b lg:border-b-0 lg:border-l border-border/60 select-none shrink-0"
          >
            {/* Subtle Luxury Dot Grid Background */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Live Rendered Card Preview Scaled to Fit */}
            <div
              style={{
                width: targetWidth,
                height: targetHeight,
                transform: `scale(${previewScale})`,
                transformOrigin: 'center center',
                flexShrink: 0,
              }}
              className="relative flex items-center justify-center z-10 transition-transform duration-150"
            >
              <PaperQuoteCard
                ref={cardRef}
                quote={quote}
                book={book}
                paperStyle={paperStyle}
                aspectRatio={aspectRatio}
                highlightMarker={highlightMarker}
                languageMode={languageMode}
                fontSizeScale={fontSizeScale}
                showWatermark={showWatermark}
              />
            </div>
          </div>

          {/* Right Sidebar: Studio Controls & Actions */}
          <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Mobile-only Category Switcher Bar */}
            <div className="lg:hidden px-4 pt-3 pb-1 shrink-0 bg-card">
              <div className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setMobileTab('ratio')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                    mobileTab === 'ratio'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Layout className="h-3.5 w-3.5" />
                  <span>ابعاد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('paper')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                    mobileTab === 'paper'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>کاغذ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('color')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                    mobileTab === 'color'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Highlighter className="h-3.5 w-3.5" />
                  <span>رنگ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('text')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                    mobileTab === 'text'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>متن</span>
                </button>
              </div>
            </div>

            {/* Mobile Controls Content Panel */}
            <div className="lg:hidden flex-1 p-4 overflow-y-auto">
              {mobileTab === 'ratio' && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-bold text-muted-foreground">انتخاب قالب و ابعاد تصویر</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ASPECT_RATIOS.map((ar) => {
                      const selected = ar.id === aspectRatio
                      return (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setAspectRatio(ar.id)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-right transition-all active:scale-95',
                            selected
                              ? 'border-gold-500 bg-gold-500/10 text-foreground shadow-xs font-bold'
                              : 'border-border/60 bg-muted/20 hover:bg-muted/60 text-muted-foreground',
                          )}
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold block leading-tight">{ar.label}</span>
                            <span className="text-[10px] opacity-70 truncate block mt-0.5">{ar.iconDesc}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 rounded-md font-sans font-medium shrink-0',
                              selected
                                ? 'border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-300'
                                : 'border-border/60',
                            )}
                          >
                            {ar.ratioText}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {mobileTab === 'paper' && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-bold text-muted-foreground">انتخاب سبک و بافت کاغذ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_PAPERS.map((key) => {
                      const p = PAPER_STYLES[key]
                      const selected = p.id === paperStyle
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaperStyle(p.id)}
                          title={p.description}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all active:scale-95 bg-card',
                            selected
                              ? 'border-gold-500 shadow-xs ring-2 ring-gold-500/25 font-bold'
                              : 'border-border/50 bg-muted/20 hover:bg-muted/60 text-muted-foreground',
                          )}
                        >
                          <div
                            className={cn(
                              'h-6 w-full rounded-md shadow-xs border border-black/10 transition-all',
                              selected && 'ring-2 ring-gold-500/60 ring-offset-1 ring-offset-background',
                            )}
                            style={{ backgroundColor: p.previewColor }}
                          />
                          <span className="text-[11px] leading-tight line-clamp-1">{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {mobileTab === 'color' && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-bold text-muted-foreground">رنگ ماژیک هایلایت متن</label>
                  <div className="flex items-center justify-center gap-3.5 py-2">
                    {HIGHLIGHT_MARKERS.map((m) => {
                      const selected = m.id === highlightMarker
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setHighlightMarker(m.id)}
                          title={m.label}
                          className={cn(
                            'relative flex items-center justify-center h-11 w-11 rounded-full border-2 transition-transform active:scale-90',
                            selected
                              ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-sm'
                              : 'opacity-75 hover:opacity-100 hover:scale-105',
                          )}
                          style={{
                            backgroundColor: m.id === 'none' ? 'transparent' : m.border,
                            borderColor: m.id === 'none' ? '#71717a' : m.border,
                          }}
                        >
                          {selected && (
                            <Check className="h-4 w-4 text-white drop-shadow-md stroke-[3]" />
                          )}
                          {m.id === 'none' && !selected && (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {mobileTab === 'text' && (
                <div className="space-y-3 animate-in fade-in-50 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">زبان‌های نمایش متن</label>
                    <Tabs
                      value={languageMode}
                      onValueChange={(v) => setLanguageMode(v as 'bilingual' | 'en' | 'fa')}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-3 h-9 p-1 rounded-xl w-full">
                        <TabsTrigger value="bilingual" className="text-xs">دوزبانه</TabsTrigger>
                        <TabsTrigger value="en" className="text-xs">انگلیسی</TabsTrigger>
                        <TabsTrigger value="fa" className="text-xs">فارسی</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">بزرگ‌نمایی اندازه قلم</label>
                    <div className="flex items-center justify-between border bg-muted/20 rounded-xl h-10 px-3">
                      <button
                        type="button"
                        onClick={() => setFontSizeScale((s) => Math.max(0.85, s - 0.1))}
                        disabled={fontSizeScale <= 0.85}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-30"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold tabular-nums">
                        {toPersianDigits(Math.round(fontSizeScale * 100))}٪
                      </span>
                      <button
                        type="button"
                        onClick={() => setFontSizeScale((s) => Math.min(1.4, s + 0.1))}
                        disabled={fontSizeScale >= 1.4}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Settings Panel (Visible only on lg screens) */}
            <div className="hidden lg:block flex-1 space-y-3.5 sm:space-y-4 p-4 sm:p-5 overflow-y-auto">
              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layout className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                  قالب و ابعاد تصویر
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ASPECT_RATIOS.map((ar) => {
                    const selected = ar.id === aspectRatio
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id)}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-xl border text-right transition-all active:scale-95',
                          selected
                            ? 'border-gold-500 bg-gold-500/10 text-foreground shadow-xs font-bold'
                            : 'border-border/50 bg-muted/30 hover:bg-muted/70 text-muted-foreground',
                        )}
                      >
                        <div className="min-w-0">
                          <span className="text-xs block leading-tight">{ar.label}</span>
                          <span className="text-[10px] opacity-65 truncate block mt-0.5">
                            {ar.iconDesc}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1 py-0 rounded-md font-sans font-medium shrink-0',
                            selected
                              ? 'border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-300'
                              : 'border-border/60',
                          )}
                        >
                          {ar.ratioText}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Paper Texture / Style Selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layers className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                  سبک و جنس کاغذ
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {AVAILABLE_PAPERS.map((key) => {
                    const p = PAPER_STYLES[key]
                    const selected = p.id === paperStyle
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaperStyle(p.id)}
                        title={p.description}
                        className={cn(
                          'flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all active:scale-95 bg-card',
                          selected
                            ? 'border-gold-500 shadow-xs ring-2 ring-gold-500/20'
                            : 'border-border/40 bg-muted/20 hover:bg-muted/60',
                        )}
                      >
                        <div
                          className={cn(
                            'h-5 w-full rounded-md shadow-xs border border-black/10 transition-all',
                            selected && 'ring-2 ring-gold-500/60 ring-offset-1 ring-offset-background',
                          )}
                          style={{ backgroundColor: p.previewColor }}
                        />
                        <span
                          className={cn(
                            'text-[10px] leading-tight line-clamp-1',
                            selected ? 'text-foreground font-bold' : 'text-muted-foreground',
                          )}
                        >
                          {p.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Highlight Marker Color */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Highlighter className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" />
                  رنگ ماژیک هایلایت
                </label>
                <div className="flex items-center gap-2">
                  {HIGHLIGHT_MARKERS.map((m) => {
                    const selected = m.id === highlightMarker
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setHighlightMarker(m.id)}
                        title={m.label}
                        className={cn(
                          'relative flex items-center justify-center h-8 w-8 rounded-full border transition-transform active:scale-90',
                          selected
                            ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-sm'
                            : 'opacity-75 hover:opacity-100 hover:scale-105',
                        )}
                        style={{
                          backgroundColor: m.id === 'none' ? 'transparent' : m.border,
                          borderColor: m.id === 'none' ? '#71717a' : m.border,
                        }}
                      >
                        {selected && (
                          <Check className="h-3.5 w-3.5 text-white drop-shadow-md stroke-[3]" />
                        )}
                        {m.id === 'none' && !selected && (
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Language & Text Scale */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Language Switch */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-muted-foreground">
                    زبان‌های نمایش
                  </label>
                  <Tabs
                    value={languageMode}
                    onValueChange={(v) => setLanguageMode(v as 'bilingual' | 'en' | 'fa')}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 h-8 p-0.5 rounded-lg w-full">
                      <TabsTrigger value="bilingual" className="text-[10px] px-0">
                        دوزبانه
                      </TabsTrigger>
                      <TabsTrigger value="en" className="text-[10px] px-0">
                        انگلیسی
                      </TabsTrigger>
                      <TabsTrigger value="fa" className="text-[10px] px-0">
                        فارسی
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Font Size Scale Stepper */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-muted-foreground">
                    بزرگ‌نمایی متن
                  </label>
                  <div className="flex items-center justify-between border bg-muted/20 rounded-lg h-8 px-2">
                    <button
                      type="button"
                      onClick={() => setFontSizeScale((s) => Math.max(0.85, s - 0.1))}
                      disabled={fontSizeScale <= 0.85}
                      className="p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-[11px] font-bold tabular-nums">
                      {toPersianDigits(Math.round(fontSizeScale * 100))}٪
                    </span>
                    <button
                      type="button"
                      onClick={() => setFontSizeScale((s) => Math.min(1.4, s + 0.1))}
                      disabled={fontSizeScale >= 1.4}
                      className="p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Panel — compact, accessible & sticky */}
            <div className="p-3 sm:p-4 bg-card border-t border-border/60 shadow-[0_-6px_14px_rgba(0,0,0,0.03)] space-y-2 shrink-0">
              <Button
                variant="glow"
                size="default"
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full gap-2 font-bold rounded-xl shadow-sm h-10 text-xs sm:text-sm"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال پردازش تصویر...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    دانلود عکس با کیفیت بالا (HD)
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyImage}
                  disabled={isExporting}
                  className="gap-1.5 rounded-xl text-xs h-8.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      کپی تصویر
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={isExporting}
                  className="gap-1.5 rounded-xl text-xs h-8.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  اشتراک‌گذاری
                </Button>
              </div>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  کپی متن کوت (به تنهایی)
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
