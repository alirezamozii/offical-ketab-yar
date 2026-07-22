'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { buildShareText, MONTHS_FA, type StatsPayload } from '@/lib/stats-data'
import { cn } from '@/lib/utils'

/**
 * ShareCard — a beautiful, shareable summary of the user's Year-in-Review.
 *
 * Three actions:
 *   • Download PNG — renders the card to a <canvas> element and triggers a
 *     download. Pure Canvas 2D API (no external deps) so it works offline
 *     and in restricted environments.
 *   • Copy text — copies a Persian text summary to the clipboard.
 *   • Share — uses the Web Share API when available (mobile / desktop
 *     browsers with a share sheet). Falls back to copy-text on unsupported
 *     platforms.
 *
 * The visible card on the page is a styled <div> (Tailwind + framer-motion).
 * The canvas PNG is a hand-rendered mirror of the same content — kept
 * deliberately simpler so the canvas code stays maintainable.
 *
 * Color palette: gold / amber / emerald / rose only — no indigo/blue.
 */

interface ShareCardProps {
  payload: StatsPayload
}

/** Map a "from-to" Tailwind gradient class string to a [from, to] hex pair
 *  for canvas rendering. We support the same palette we use elsewhere. */
const GRADIENT_HEX: Record<string, [string, string]> = {
  'from-gold-400 to-amber-600': ['#fbbf24', '#d97706'],
  'from-amber-300 to-orange-500': ['#fcd34d', '#f97316'],
  'from-amber-400 to-orange-500': ['#fbbf24', '#f97316'],
  'from-amber-400 to-yellow-500': ['#fbbf24', '#eab308'],
  'from-amber-400 to-rose-500': ['#fbbf24', '#f43f5e'],
  'from-emerald-400 to-teal-500': ['#34d399', '#14b8a6'],
  'from-emerald-400 to-teal-600': ['#34d399', '#0d9488'],
  'from-emerald-400 to-cyan-500': ['#34d399', '#06b6d4'],
  'from-rose-400 to-red-500': ['#fb7185', '#ef4444'],
  'from-rose-400 via-pink-500 to-fuchsia-600': ['#fb7185', '#c026d3'],
  'from-stone-400 to-stone-600': ['#a8a29e', '#57534e'],
  'from-gold-400 to-amber-500': ['#fbbf24', '#f59e0b'],
  'from-rose-400 via-amber-400 to-fuchsia-600': ['#fb7185', '#c026d3'],
}

/** Pick a [from, to] hex pair for the canvas gradient. */
function gradientFor(classStr: string): [string, string] {
  return GRADIENT_HEX[classStr] ?? ['#fbbf24', '#d97706']
}

export function ShareCard({ payload }: ShareCardProps) {
  const reduceMotion = useReducedMotion()
  const { toPersianDigits, formatNumber } = usePersianLocale()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const shareText = useMemo(() => buildShareText(payload), [payload])
  const [gradFrom, gradTo] = useMemo(
    () => gradientFor(payload.personality.color),
    [payload.personality.color],
  )

  const topGenre = payload.topGenres[0]?.name ?? '—'
  const topAuthor = payload.topAuthors[0]?.name ?? '—'
  const now = new Date()
  const monthLabel = MONTHS_FA[now.getMonth() % 12]
  const yearLabel = toPersianDigits(now.getFullYear() - 621) // rough Jalali year offset

  // ── Canvas PNG renderer ──────────────────────────────────────────────
  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      const W = 1080
      const H = 1350
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // (1) Background — dark with a subtle radial gold glow at top.
      ctx.fillStyle = '#0c0a09' // stone-950
      ctx.fillRect(0, 0, W, H)
      const glow = ctx.createRadialGradient(W / 2, 80, 40, W / 2, 80, 900)
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.35)') // gold-400
      glow.addColorStop(0.4, 'rgba(217, 119, 6, 0.15)') // amber-600
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      // (2) Top brand bar — "کتاب‌یار" + Jalali month/year label.
      ctx.fillStyle = '#fbbf24' // gold-400
      ctx.font = '700 36px sans-serif'
      ctx.textAlign = 'right'
      ctx.direction = 'rtl'
      ctx.fillText('کتاب‌یار', W - 60, 80)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '500 26px sans-serif'
      ctx.fillText(`${monthLabel} ${yearLabel}`, 60, 80)

      // (3) Headline.
      ctx.fillStyle = '#fafaf9' // stone-50
      ctx.font = '800 64px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('سال من در کتاب‌ها', W / 2, 200)

      // (4) Big "total pages" number — gold gradient fill via createLinearGradient.
      const bigNum = formatNumber(payload.totals.totalPages)
      const grad = ctx.createLinearGradient(0, 230, 0, 380)
      grad.addColorStop(0, gradFrom)
      grad.addColorStop(1, gradTo)
      ctx.fillStyle = grad
      ctx.font = '900 150px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(bigNum, W / 2, 360)

      // (5) "صفحه خواندم" subtitle.
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '500 32px sans-serif'
      ctx.fillText('صفحه خواندم', W / 2, 420)

      // (6) Stat grid — 4 cells in a row.
      const stats: { label: string; value: string }[] = [
        { label: 'کتاب تمام شده', value: toPersianDigits(payload.totals.booksCompleted) },
        { label: 'دقیقه مطالعه', value: formatNumber(payload.totals.totalReadingMinutes) },
        { label: 'روز استمرار', value: toPersianDigits(payload.streak.longest) },
        { label: 'واژه', value: formatNumber(payload.totals.vocabCount) },
      ]
      const cellW = (W - 120) / 4
      const cellY = 500
      stats.forEach((s, i) => {
        const x = 60 + i * cellW
        // Card background.
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        roundRect(ctx, x + 8, cellY, cellW - 16, 160, 20)
        ctx.fill()
        // Value.
        ctx.fillStyle = '#fbbf24'
        ctx.font = '800 56px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(s.value, x + cellW / 2, cellY + 80)
        // Label.
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '500 22px sans-serif'
        ctx.fillText(s.label, x + cellW / 2, cellY + 120)
      })

      // (7) Personality badge — rounded rect with gradient fill.
      const badgeY = 720
      const badgeH = 180
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      roundRect(ctx, 60, badgeY, W - 120, badgeH, 28)
      ctx.fill()
      const bgrad = ctx.createLinearGradient(60, badgeY, 60, badgeY + badgeH)
      bgrad.addColorStop(0, `${gradFrom}33`)
      bgrad.addColorStop(1, `${gradTo}22`)
      ctx.fillStyle = bgrad
      roundRect(ctx, 60, badgeY, W - 120, badgeH, 28)
      ctx.fill()

      ctx.fillStyle = gradFrom
      ctx.font = '900 60px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(payload.personality.icon, W - 100, badgeY + 80)
      ctx.fillStyle = '#fafaf9'
      ctx.font = '800 44px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(payload.personality.title, W - 180, badgeY + 80)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '400 22px sans-serif'
      // Wrap the description into 2 lines max.
      const desc = payload.personality.description
      ctx.fillText(desc.slice(0, 50), W - 100, badgeY + 130)
      if (desc.length > 50) {
        ctx.fillText(desc.slice(50, 100), W - 100, badgeY + 160)
      }

      // (8) Top genre + top author rows.
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      roundRect(ctx, 60, 940, W - 120, 200, 24)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '500 26px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('ژانر محبوب', W - 100, 990)
      ctx.fillText('نویسنده محبوب', W - 100, 1070)
      ctx.fillStyle = '#fbbf24'
      ctx.font = '700 36px sans-serif'
      ctx.fillText(topGenre, 100, 990)
      ctx.fillStyle = '#34d399' // emerald-400
      ctx.fillText(topAuthor, 100, 1070)

      // (9) Footer — KETABYAR.IR branding per user feedback.
      // Old: "کتاب‌یار — همراه مطالعه شما" + "ketabyar.ir/stats"
      // New: bold "KETABYAR.IR" + subtle tagline below.
      ctx.fillStyle = '#fbbf24'
      ctx.font = '800 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KETABYAR.IR', W / 2, 1260)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '500 22px sans-serif'
      ctx.fillText('همراه مطالعه شما', W / 2, 1300)
    },
    [
      payload,
      gradFrom,
      gradTo,
      monthLabel,
      yearLabel,
      formatNumber,
      toPersianDigits,
      topAuthor,
      topGenre,
    ],
  )

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      // Reuse a singleton canvas (no need to attach it to the DOM).
      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }
      renderToCanvas(canvas)
      await new Promise<void>((resolve, reject) => {
        canvas!.toBlob((blob) => {
          if (!blob) {
            reject(new Error('canvas toBlob returned null'))
            return
          }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ketabyar-stats-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          resolve()
        }, 'image/png')
      })
      toast.success('تصویر کارت آماده شد و دانلود شد.')
    } catch (err) {
      console.error('[ShareCard] download failed:', err)
      toast.error('دانلود تصویر ناموفق بود. لطفاً دوباره تلاش کنید.')
    } finally {
      setDownloading(false)
    }
  }, [renderToCanvas])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success('متن آمار کپی شد.')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[ShareCard] copy failed:', err)
      toast.error('کپی متن ناموفق بود.')
    }
  }, [shareText])

  const handleShare = useCallback(async () => {
    // Web Share API — file sharing when supported, otherwise text-only.
    try {
      if (typeof navigator === 'undefined' || !navigator.share) {
        await handleCopy()
        return
      }
      // Try to share the PNG image (best UX). Fallback to text.
      try {
        let canvas = canvasRef.current
        if (!canvas) {
          canvas = document.createElement('canvas')
          canvasRef.current = canvas
        }
        renderToCanvas(canvas)
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        )
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'ketabyar-stats.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'ketabyar-stats.png', { type: 'image/png' })
          await navigator.share({
            title: 'سال من در کتاب‌ها',
            text: shareText,
            files: [file],
          })
          return
        }
      } catch {
        /* fall through to text-only share */
      }
      await navigator.share({
        title: 'سال من در کتاب‌ها',
        text: shareText,
        url: typeof window !== 'undefined' ? `${window.location.origin}/stats` : undefined,
      })
    } catch (err) {
      // AbortError is normal (user dismissed the share sheet).
      if ((err as Error)?.name === 'AbortError') return
      console.error('[ShareCard] share failed:', err)
      toast.info('اشتراک‌گذاری پشتیبانی نمی‌شود — متن کپی شد.')
      await handleCopy()
    }
  }, [renderToCanvas, shareText, handleCopy])

  // ── Visible on-page card ───────────────────────────────────────────
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 shadow-2xl"
    >
      {/* Top brand bar */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <span className="text-xs font-medium text-gold-400">کتاب‌یار</span>
        <span className="text-[10px] text-white/40">
          {monthLabel} {yearLabel}
        </span>
      </div>

      {/* Card body */}
      <div className="relative px-6 py-8 sm:px-8">
        {/* Ambient gold glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold-500/20 blur-3xl"
        />

        <h3 className="relative text-center text-2xl font-extrabold text-stone-50 sm:text-3xl">
          سال من در کتاب‌ها
        </h3>

        {/* Big pages number */}
        <div className="relative mt-3 text-center">
          <div
            className={cn(
              'bg-gradient-to-br bg-clip-text text-5xl font-black text-transparent sm:text-6xl',
              payload.personality.color,
            )}
            dir="ltr"
          >
            {formatNumber(payload.totals.totalPages)}
          </div>
          <p className="mt-1 text-sm text-white/60">صفحه خواندم</p>
        </div>

        {/* Mini stat grid */}
        <div className="relative mt-6 grid grid-cols-4 gap-2">
          {[
            { label: 'کتاب', value: toPersianDigits(payload.totals.booksCompleted) },
            { label: 'دقیقه', value: formatNumber(payload.totals.totalReadingMinutes) },
            { label: 'استمرار', value: toPersianDigits(payload.streak.longest) },
            { label: 'واژه', value: formatNumber(payload.totals.vocabCount) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/5 px-2 py-3 text-center"
            >
              <div className="text-lg font-extrabold text-gold-400">{s.value}</div>
              <div className="mt-0.5 text-[10px] text-white/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Personality badge */}
        <div className="relative mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{payload.personality.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-stone-50">
                {payload.personality.title}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs text-white/60">
                {payload.personality.description}
              </div>
            </div>
          </div>
        </div>

        {/* Top genre + author */}
        <div className="relative mt-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-white/50">ژانر محبوب</span>
            <span className="text-sm font-bold text-gold-400">{topGenre}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-xs text-white/50">نویسنده محبوب</span>
            <span className="text-sm font-bold text-emerald-400">{topAuthor}</span>
          </div>
        </div>

        <div className="relative mt-4 text-center">
          <span className="text-xs font-bold tracking-wider text-gold-400">KETABYAR.IR</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-white/[0.02] px-5 py-3">
        <Button
          type="button"
          variant="glow"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-1.5"
          aria-label="دانلود کارت آمار به‌صورت تصویر"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? 'در حال ساخت...' : 'دانلود تصویر'}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1.5 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          aria-label="اشتراک‌گذاری آمار"
        >
          <Share2 className="h-4 w-4" />
          <span>اشتراک‌گذاری</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="کپی متن آمار"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
        </Button>
      </div>
    </motion.div>
  )
}

/** Helper: draw a rounded rectangle path on a 2D context. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
