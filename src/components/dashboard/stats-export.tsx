'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Braces,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useReadingStreak, type StreakData } from '@/hooks/reader/use-reading-streak'
import { getLocalProgress } from '@/hooks/reader/use-local-progress'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { SITE } from '@/lib/site'

interface XPStat {
  level: number
  levelTitle: string
  totalXP: number
  progressPercentage: number
  xpForNextLevel: number
}

async function fetchXP(): Promise<XPStat | null> {
  try {
    const res = await fetch('/api/xp', { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as XPStat
  } catch {
    return null
  }
}

const fa = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

type ExportFormat = 'png' | 'json' | 'csv'

/* ------------------------------------------------------------------ */
/*  Data collector — pure function, takes streak data as an argument   */
/* ------------------------------------------------------------------ */
interface ExportPayload {
  exportedAt: string
  level: number | null
  levelTitle: string | null
  totalXP: number | null
  progressPercentage: number | null
  booksStarted: number
  booksCompleted: number
  totalPagesRead: number
  totalReadingDays: number
  longestStreak: number
  currentStreak: number
  todayMinutes: number
  books: Array<{
    slug: string
    currentPage: number
    totalPages: number
    percent: number
    lastReadAt: string | null
  }>
}

async function collectPayload(streak: StreakData): Promise<ExportPayload> {
  const xp = await fetchXP()
  const progress = getLocalProgress()
  const booksStarted = Object.keys(progress).length
  const booksCompleted = Object.values(progress).filter((p) => p.percent >= 100).length
  const totalPages = Object.values(progress).reduce(
    (s, p) => s + Math.round((p.percent / 100) * p.totalPages),
    0,
  )
  return {
    exportedAt: new Date().toISOString(),
    level: xp?.level ?? null,
    levelTitle: xp?.levelTitle ?? null,
    totalXP: xp?.totalXP ?? null,
    progressPercentage: xp?.progressPercentage ?? null,
    booksStarted,
    booksCompleted,
    totalPagesRead: totalPages,
    totalReadingDays: streak.totalReadingDays,
    longestStreak: streak.longestStreak,
    currentStreak: streak.currentStreak,
    todayMinutes: Math.floor(streak.todaySeconds / 60),
    books: Object.entries(progress).map(([slug, p]) => ({
      slug,
      currentPage: p.currentPage,
      totalPages: p.totalPages,
      percent: p.percent,
      lastReadAt: p.lastReadAt ? new Date(p.lastReadAt).toISOString() : null,
    })),
  }
}

/* ------------------------------------------------------------------ */
/*  StatsExport                                                         */
/* ------------------------------------------------------------------ */
export function StatsExport() {
  const { data } = useReadingStreak()
  const { toPersianDigits } = usePersianLocale()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [open, setOpen] = useState(false)
  const [lastFormat, setLastFormat] = useState<ExportFormat | null>(null)

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  async function generateCard(): Promise<HTMLCanvasElement> {
    const W = 800
    const H = 540
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#faf9f7')
    grad.addColorStop(0.5, '#f5f2ed')
    grad.addColorStop(1, '#ebe4d9')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // decorative circles
    ctx.fillStyle = 'rgba(184, 149, 106, 0.12)'
    ctx.beginPath()
    ctx.arc(W - 80, 80, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(166, 127, 86, 0.1)'
    ctx.beginPath()
    ctx.arc(80, H - 60, 100, 0, Math.PI * 2)
    ctx.fill()

    // brand
    ctx.fillStyle = '#b8956a'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('کتاب‌یار', 40, 50)
    ctx.fillStyle = '#8a6847'
    ctx.font = '13px sans-serif'
    ctx.fillText('خلاصه مطالعه من', 40, 70)

    // ---------- Level + XP header band ----------
    const xp = await fetchXP()
    const headerY = 90
    const headerH = 80
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    drawRoundedRect(ctx, 40, headerY, W - 80, headerH, 16)
    ctx.fill()

    if (xp) {
      const badgeX = 80
      const badgeY = headerY + headerH / 2
      const badgeR = 28
      const lg = ctx.createLinearGradient(
        badgeX - badgeR,
        badgeY - badgeR,
        badgeX + badgeR,
        badgeY + badgeR,
      )
      lg.addColorStop(0, '#cdb89a')
      lg.addColorStop(1, '#8a6847')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('LVL', badgeX, badgeY - 6)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(fa(xp.level), badgeX, badgeY + 16)

      ctx.textAlign = 'left'
      ctx.fillStyle = '#523d2c'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(xp.levelTitle, 130, badgeY - 4)
      ctx.fillStyle = '#8a6847'
      ctx.font = '13px sans-serif'
      const remaining = Math.max(0, xp.xpForNextLevel - xp.totalXP)
      const progressLabel =
        xp.progressPercentage >= 100
          ? `${fa(xp.totalXP)} XP — حداکثر سطح`
          : `${fa(xp.totalXP)} XP — ${fa(remaining)} XP تا سطح بعد`
      ctx.fillText(progressLabel, 130, badgeY + 18)

      const barX = 480
      const barY = badgeY - 6
      const barW = 280
      const barH = 12
      ctx.fillStyle = 'rgba(166, 127, 86, 0.18)'
      drawRoundedRect(ctx, barX, barY, barW, barH, 6)
      ctx.fill()
      const fg = ctx.createLinearGradient(barX, barY, barX + barW, barY)
      fg.addColorStop(0, '#cdb89a')
      fg.addColorStop(1, '#8a6847')
      ctx.fillStyle = fg
      const fillW = Math.max(8, (barW * Math.min(100, xp.progressPercentage)) / 100)
      drawRoundedRect(ctx, barX, barY, fillW, barH, 6)
      ctx.fill()
      ctx.fillStyle = '#8a6847'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${fa(xp.progressPercentage)}٪`, barX + barW, barY + 26)
    } else {
      ctx.fillStyle = '#8a6847'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('اطلاعات سطح در دسترس نیست', 60, headerY + 48)
    }

    // compute stats
    const progress = getLocalProgress()
    const booksStarted = Object.keys(progress).length
    const booksCompleted = Object.values(progress).filter((p) => p.percent >= 100).length
    const totalPages = Object.values(progress).reduce(
      (s, p) => s + Math.round((p.percent / 100) * p.totalPages),
      0,
    )
    const minutes = Math.floor(data.todaySeconds / 60)

    const stats = [
      { label: 'کتاب شروع‌شده', value: fa(booksStarted) },
      { label: 'کتاب تمام‌شده', value: fa(booksCompleted) },
      { label: 'صفحات خوانده‌شده', value: fa(totalPages) },
      { label: 'روز فعال', value: fa(data.totalReadingDays) },
      { label: 'بهترین رکورد', value: fa(data.longestStreak) + ' روز' },
      { label: 'دقیقه امروز', value: fa(minutes) },
    ]
    const cardW = 220
    const cardH = 84
    const gap = 16
    const startX = 40
    const startY = 200
    ctx.textAlign = 'center'
    stats.forEach((s, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = startX + col * (cardW + gap)
      const y = startY + row * (cardH + gap)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      drawRoundedRect(ctx, x, y, cardW, cardH, 14)
      ctx.fill()
      ctx.fillStyle = '#a67f56'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText(s.value, x + cardW / 2, y + 48)
      ctx.fillStyle = '#6b6354'
      ctx.font = '13px sans-serif'
      ctx.fillText(s.label, x + cardW / 2, y + 70)
    })

    // footer
    ctx.fillStyle = '#8a6847'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    const date = new Date().toLocaleDateString('fa-IR')
    ctx.fillText(`کتاب‌یار — ${date}`, 40, H - 22)
    ctx.textAlign = 'right'
    ctx.fillText(new URL(SITE.url).host, W - 40, H - 22)

    return canvas
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPng() {
    setExporting('png')
    try {
      const canvas = await generateCard()
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (!blob) throw new Error('blob failed')
      downloadBlob(blob, `ketab-yar-stats-${Date.now()}.png`)
      toast.success('تصویر خلاصه دانلود شد')
      setLastFormat('png')
      setOpen(false)
    } catch {
      toast.error('خطا در ساخت تصویر')
    } finally {
      setExporting(null)
    }
  }

  async function shareNative() {
    setExporting('png')
    try {
      const canvas = await generateCard()
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (!blob) throw new Error('blob failed')
      const file = new File([blob], 'ketab-yar-stats.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'خلاصه مطالعه من در کتاب‌یار',
        })
        setLastFormat('png')
        setOpen(false)
      } else {
        await downloadPng()
      }
    } catch {
      toast.error('اشتراک‌گذاری ناموفق بود')
    } finally {
      setExporting(null)
    }
  }

  async function downloadJson() {
    setExporting('json')
    try {
      const payload = await collectPayload(data)
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(blob, `ketab-yar-stats-${Date.now()}.json`)
      toast.success('فایل JSON دانلود شد')
      setLastFormat('json')
      setOpen(false)
    } catch {
      toast.error('خطا در ساخت فایل JSON')
    } finally {
      setExporting(null)
    }
  }

  async function downloadCsv() {
    setExporting('csv')
    try {
      const payload = await collectPayload(data)
      const rows: string[] = [
        'field,value',
        `exportedAt,${payload.exportedAt}`,
        `level,${payload.level ?? ''}`,
        `levelTitle,${payload.levelTitle ?? ''}`,
        `totalXP,${payload.totalXP ?? ''}`,
        `progressPercentage,${payload.progressPercentage ?? ''}`,
        `booksStarted,${payload.booksStarted}`,
        `booksCompleted,${payload.booksCompleted}`,
        `totalPagesRead,${payload.totalPagesRead}`,
        `totalReadingDays,${payload.totalReadingDays}`,
        `longestStreak,${payload.longestStreak}`,
        `currentStreak,${payload.currentStreak}`,
        `todayMinutes,${payload.todayMinutes}`,
        '',
        'slug,currentPage,totalPages,percent,lastReadAt',
        ...payload.books.map(
          (b) =>
            `${b.slug},${b.currentPage},${b.totalPages},${b.percent},${b.lastReadAt ?? ''}`,
        ),
      ]
      // Prepend BOM so Excel reads UTF-8 (Persian text) correctly.
      const blob = new Blob(['\uFEFF' + rows.join('\n')], {
        type: 'text/csv;charset=utf-8',
      })
      downloadBlob(blob, `ketab-yar-stats-${Date.now()}.csv`)
      toast.success('فایل CSV دانلود شد')
      setLastFormat('csv')
      setOpen(false)
    } catch {
      toast.error('خطا در ساخت فایل CSV')
    } finally {
      setExporting(null)
    }
  }

  // Build a small live preview of the data that will be exported.
  const progress = typeof window !== 'undefined' ? getLocalProgress() : {}
  const previewStats = [
    { label: 'سطح', value: '—' },
    { label: 'کتاب شروع‌شده', value: toPersianDigits(Object.keys(progress).length) },
    {
      label: 'کتاب تمام‌شده',
      value: toPersianDigits(
        Object.values(progress).filter((p) => p.percent >= 100).length,
      ),
    },
    {
      label: 'صفحات',
      value: toPersianDigits(
        Object.values(progress).reduce(
          (s, p) => s + Math.round((p.percent / 100) * p.totalPages),
          0,
        ),
      ),
    },
    {
      label: 'روز فعال',
      value: toPersianDigits(data.totalReadingDays),
    },
    {
      label: 'دقیقه امروز',
      value: toPersianDigits(Math.floor(data.todaySeconds / 60)),
    },
  ]

  const formats: {
    id: ExportFormat
    label: string
    desc: string
    icon: typeof ImageIcon
    action: () => void
  }[] = [
    {
      id: 'png',
      label: 'تصویر PNG',
      desc: 'کارت آماده برای اشتراک',
      icon: ImageIcon,
      action: downloadPng,
    },
    {
      id: 'json',
      label: 'فایل JSON',
      desc: 'داده‌های ساختاریافته',
      icon: Braces,
      action: downloadJson,
    },
    {
      id: 'csv',
      label: 'فایل CSV',
      desc: 'بازشدنی در Excel',
      icon: FileText,
      action: downloadCsv,
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="glow"
          size="sm"
          className="gap-2 shadow-md"
          aria-label="اشتراک و خروجی آمار"
        >
          <Share2 className="h-4 w-4" />
          <span>اشتراک آمار</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
            <Share2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">خلاصه آمار مطالعه</p>
            <p className="text-[11px] text-muted-foreground">
              یک قالب برای خروجی انتخاب کنید
            </p>
          </div>
        </div>

        {/* Preview pane */}
        <div className="mb-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            پیش‌نمایش
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {previewStats.map((s) => (
              <div key={s.label} className="rounded-md bg-background/60 py-1.5">
                <div className="text-sm font-extrabold tabular-nums text-gold-700 dark:text-gold-400">
                  {s.value}
                </div>
                <div className="text-[9px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Format options */}
        <div className="space-y-1">
          {formats.map((f) => {
            const Icon = f.icon
            const isExporting = exporting === f.id
            const isDone = lastFormat === f.id && !isExporting
            return (
              <button
                key={f.id}
                onClick={f.action}
                disabled={exporting !== null}
                className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-right transition-colors hover:border-gold-400/30 hover:bg-gold-500/5 disabled:opacity-50"
                aria-label={`خروجی ${f.label}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isDone ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                </div>
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )
          })}
        </div>

        {/* Share native */}
        <button
          onClick={shareNative}
          disabled={exporting !== null}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-3 py-2 text-sm font-bold text-white shadow-md transition-[transform,opacity,colors,border-color,background-color] hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
          aria-label="اشتراک‌گذاری تصویر"
        >
          {exporting === 'png' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          اشتراک‌گذاری مستقیم
        </button>

        <p className="mt-2 px-1 text-[10px] leading-snug text-muted-foreground">
          شامل: سطح و XP، کتاب‌های خوانده‌شده، صفحات، روزهای فعال، رکورد روزانه،
          و وضعیت هر کتاب.
        </p>
      </PopoverContent>
    </Popover>
  )
}
