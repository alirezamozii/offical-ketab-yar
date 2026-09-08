'use client'

/**
 * src/components/settings/settings-page-client.tsx
 * ---------------------------------------------------------------
 * /settings — centralized user-preferences hub.
 *
 * Layout: left sidebar (desktop) / top tabs (mobile) of 8 sections:
 *   1. خواندن            (Reading)        — BookOpen
 *   2. ظاهر              (Appearance)     — Palette
 *   3. اعلان‌ها           (Notifications)  — Bell
 *   4. دسترسی‌پذیری       (Accessibility)  — Accessibility
 *   5. حریم خصوصی        (Privacy)        — Shield
 *   6. زبان              (Language)       — Languages
 *   7. داده‌ها            (Data)           — Database
 *   8. درباره            (About)          — Info
 *
 * All settings persist to `STORAGE_KEYS.settings` (`ky_settings`) on
 * every change. A toast "ذخیره شد" announces each save. Animations
 * gate on `useReducedMotion`. All visible text is Farsi; numbers go
 * through `usePersianLocale`.
 * ---------------------------------------------------------------
 */

import * as React from 'react'
import { errorMessage } from '@/lib/error'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useThemeToggle } from '@/hooks/use-theme-toggle'
import { toast } from 'sonner'
import {
  Accessibility,
  Bell,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Database,
  Download,
  Flame,
  Info,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Heart,
  PartyPopper,
  XCircle,
  AlertTriangle,
  UserX,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { signOut, useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePersianLocale } from '@/hooks/use-persian-locale'
import { STORAGE_KEYS, clearAllKyStorage } from '@/lib/storage-keys'
import { useReaderSettingsStore, type ReaderTheme as ReaderStoreTheme } from '@/lib/store/reader-settings-store'
import {
  type ReadingLanguage,
  type ReadingFontFamily,
  type ReadingLayout,
  type ReadingMarginWidth,
  type ReadingTheme,
  DEFAULT_SETTINGS,
  useSettings,
} from '@/lib/settings'
import { SITE } from '@/lib/site'
import { resetOnboarding } from '@/lib/onboarding'
import {
  getNotificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  sendTestNotification,
  setNotifBannerDismissed,
  type NotificationPermissionState,
} from '@/lib/notifications'

// ---------------------------------------------------------------------------
// Section registry
// ---------------------------------------------------------------------------

function TimePicker24({ value, onChange, ariaLabel }: { value: string, onChange: (v: string) => void, ariaLabel?: string }) {
  const [h = '20', m = '00'] = (value || '20:00').split(':')
  return (
    <div className="flex h-9 w-32 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring" style={{ direction: 'ltr' }}>
      <div className="flex items-center gap-0.5 tabular-nums">
        <select 
          value={h} 
          onChange={e => onChange(`${e.target.value}:${m}`)}
          className="appearance-none bg-transparent outline-none cursor-pointer hover:text-gold-500 transition-colors"
          aria-label={`${ariaLabel} ساعت`}
        >
          {Array.from({length: 24}).map((_, i) => {
            const val = i.toString().padStart(2, '0')
            return <option key={val} value={val} className="bg-background text-foreground">{val}</option>
          })}
        </select>
        <span className="text-muted-foreground pb-0.5">:</span>
        <select 
          value={m} 
          onChange={e => onChange(`${h}:${e.target.value}`)}
          className="appearance-none bg-transparent outline-none cursor-pointer hover:text-gold-500 transition-colors"
          aria-label={`${ariaLabel} دقیقه`}
        >
          {Array.from({length: 60}).map((_, i) => {
            const val = i.toString().padStart(2, '0')
            return <option key={val} value={val} className="bg-background text-foreground">{val}</option>
          })}
        </select>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

type SectionId =
  | 'reading'
  | 'appearance'
  | 'notifications'
  | 'accessibility'
  | 'privacy'
  | 'data'
  | 'about'

interface SectionMeta {
  id: SectionId
  label: string
  icon: LucideIcon
  description: string
}

const SECTIONS: SectionMeta[] = [
  { id: 'reading', label: 'خواندن', icon: BookOpen, description: 'فونت، سایز، چیدمان و تم مطالعه' },
  { id: 'appearance', label: 'ظاهر', icon: Palette, description: 'تم برنامه و رنگ تاکیدی' },
  { id: 'notifications', label: 'اعلان‌ها', icon: Bell, description: 'یادآوری روزانه و هشدارها' },
  { id: 'accessibility', label: 'دسترسی‌پذیری', icon: Accessibility, description: 'حرکت، کنتراست و فوکوس' },
  { id: 'privacy', label: 'حریم خصوصی', icon: Shield, description: 'اشتراک‌گذاری آمار و پروفایل' },
  { id: 'data', label: 'داده‌ها', icon: Database, description: 'خروجی، ورود و پاک‌سازی داده' },
  { id: 'about', label: 'درباره', icon: Info, description: 'نسخه، اعتبارها و پیوندها' },
]

// ---------------------------------------------------------------------------
// Theme preview swatches for the Reading section
// ---------------------------------------------------------------------------

const READING_THEME_PREVIEW: Record<
  ReadingTheme,
  { label: string; bg: string; text: string; accent: string }
> = {
  day: { label: 'روز', bg: '#faf8f3', text: '#2a2a2a', accent: '#a67f56' },
  night: { label: 'شب', bg: '#1a1814', text: '#e8e4dc', accent: '#cdb89a' },
  sepia: { label: 'سپیا', bg: '#f4ecd8', text: '#5f4b32', accent: '#8a6a4b' },
  'high-contrast': { label: 'کنتراست بالا', bg: '#000000', text: '#ffffff', accent: '#ffd54a' },
}

const FONT_FAMILIES: { id: ReadingFontFamily; label: string; stack: string }[] = [
  { id: 'vazirmatn', label: 'وزیرمتن', stack: "Vazirmatn, system-ui, sans-serif" },
  { id: 'serif', label: 'سریف', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'sans', label: 'سنس', stack: "system-ui, -apple-system, sans-serif" },
]

const MARGIN_WIDTHS: { id: ReadingMarginWidth; label: string; bar: string }[] = [
  { id: 'narrow', label: 'باریک', bar: 'max-w-[60%]' },
  { id: 'medium', label: 'متوسط', bar: 'max-w-[80%]' },
  { id: 'wide', label: 'پهن', bar: 'max-w-[100%]' },
]

// ---------------------------------------------------------------------------
// Reusable row primitive — switch on the right, label + description on the left
// ---------------------------------------------------------------------------

function SwitchRow({
  title,
  description,
  checked,
  onChange,
  ariaLabel,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={ariaLabel}
        className="shrink-0"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 flex items-start gap-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 text-gold-700 ring-1 ring-gold-500/30 dark:text-gold-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Setting card wrapper
// ---------------------------------------------------------------------------

function SettingCard({
  title,
  description,
  children,
  action,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
      {(title || action) && (
        <CardHeader className="flex flex-row items-start gap-3 border-b border-border/40 pb-4">
          {action && <div className="shrink-0 pt-0.5">{action}</div>}
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-bold">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-xs leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

// ===========================================================================
// 1. READING SECTION
// ===========================================================================

function ReadingSection() {
  const { settings, updateSection } = useSettings()
  const locale = usePersianLocale()
  const reduceMotion = useReducedMotion()
  const r = settings.reading
  const readerStore = useReaderSettingsStore()

  // 2-way sync: Update local settings AND Zustand reader store
  const setReading = <K extends keyof typeof r>(key: K, value: (typeof r)[K]) => {
    updateSection('reading', key, value)

    if (key === 'fontSize' && typeof value === 'number') {
      readerStore.setFontSize(value)
    } else if (key === 'lineHeight' && typeof value === 'number') {
      readerStore.setLineHeight(value)
    } else if (key === 'letterSpacing' && typeof value === 'number') {
      readerStore.setLetterSpacing(value)
    } else if (key === 'fontFamily' && typeof value === 'string') {
      readerStore.setFontFamily(value as any)
    } else if (key === 'theme' && typeof value === 'string') {
      const themeMap: Record<string, ReaderStoreTheme> = {
        day: 'light',
        night: 'dark',
        sepia: 'sepia',
        'high-contrast': 'high-contrast',
      }
      readerStore.setTheme(themeMap[value] || 'sepia')
    }
  }

  const previewStyle: React.CSSProperties = {
    fontSize: `${r.fontSize}px`,
    lineHeight: r.lineHeight,
    letterSpacing: `${r.letterSpacing}em`,
    fontFamily:
      r.fontFamily === 'vazirmatn'
        ? "Vazirmatn, system-ui, sans-serif"
        : r.fontFamily === 'serif'
          ? "Georgia, 'Times New Roman', serif"
          : "system-ui, -apple-system, sans-serif",
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={BookOpen}
        title="تنظیمات مطالعه"
        description="فونت، فاصله‌گذاری، چیدمان و تم صفحات کتاب را تنظیم کنید."
      />

      {/* Live preview — STICKY PINNED so controls update live on scroll */}
      <div className="sticky top-[88px] z-30 rounded-2xl border border-gold-500/30 bg-background/95 dark:bg-card/95 shadow-2xl backdrop-blur-2xl p-1 transition-all">
        <SettingCard title="پیش‌نمایش زنده (دوزبانه)">
          <div
            className="space-y-2.5 rounded-xl border border-border/40 p-3.5 transition-all"
            style={{
              background: READING_THEME_PREVIEW[r.theme].bg,
              color: READING_THEME_PREVIEW[r.theme].text,
            }}
          >
            {/* Persian Paragraph */}
            <div dir="rtl">
              <span
                className="mb-1 block text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: READING_THEME_PREVIEW[r.theme].accent }}
              >
                فارسی (Persian)
              </span>
              <p style={previewStyle} className="transition-colors duration-300">
                در دل صحرای آرام، نخستین پرتو سپیده دم بر شن‌های طلایی افتاد...
              </p>
            </div>

            <Separator className="opacity-30" />

            {/* English Paragraph */}
            <div dir="ltr">
              <span
                className="mb-1 block text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: READING_THEME_PREVIEW[r.theme].accent }}
              >
                English (Original)
              </span>
              <p
                style={{
                  fontSize: `${r.fontSize}px`,
                  lineHeight: r.lineHeight,
                  letterSpacing: `${r.letterSpacing}em`,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
                className="transition-colors duration-300"
              >
                In the quiet heart of the desert, the first beam of dawn fell upon the golden sands...
              </p>
            </div>
          </div>
        </SettingCard>
      </div>

      {/* Font size */}
      <SettingCard
        title="اندازه فونت"
        description="اندازه حروف متن مطالعه را تنظیم کنید."
        action={
          <Badge variant="secondary" className="tabular-nums">
            {locale.toPersianDigits(r.fontSize)} پیکسل
          </Badge>
        }
      >
        <Slider
          value={[r.fontSize]}
          min={14}
          max={24}
          step={1}
          onValueChange={(v) => setReading('fontSize', v[0])}
          aria-label="اندازه فونت مطالعه"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>۱۴</span>
          <span>۱۸</span>
          <span>۲۰</span>
          <span>۲۴</span>
        </div>
      </SettingCard>

      {/* Line height */}
      <SettingCard
        title="ارتفاع خط"
        description="فاصله عمودی بین خطوط متن."
        action={
          <Badge variant="secondary" className="tabular-nums">
            {locale.toPersianDigits(r.lineHeight.toFixed(1))}
          </Badge>
        }
      >
        <Slider
          value={[r.lineHeight]}
          min={1.4}
          max={2.2}
          step={0.1}
          onValueChange={(v) => setReading('lineHeight', v[0])}
          aria-label="ارتفاع خط"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>۱٫۴</span>
          <span>۱٫۸</span>
          <span>۲٫۲</span>
        </div>
      </SettingCard>

      {/* Letter spacing */}
      <SettingCard
        title="فاصله حروف"
        description="فاصله افقی بین کاراکترها (em)."
        action={
          <Badge variant="secondary" className="tabular-nums">
            {locale.toPersianDigits(r.letterSpacing.toFixed(2))}
          </Badge>
        }
      >
        <Slider
          value={[r.letterSpacing]}
          min={-0.05}
          max={0.05}
          step={0.01}
          onValueChange={(v) => setReading('letterSpacing', v[0])}
          aria-label="فاصله حروف"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>−۰٫۰۵</span>
          <span>۰</span>
          <span>+۰٫۰۵</span>
        </div>
      </SettingCard>

      {/* Font family */}
      <SettingCard title="نوع قلم" description="خانواده فونت متن مطالعه.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FONT_FAMILIES.map((f) => {
            const active = r.fontFamily === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setReading('fontFamily', f.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-right transition-[transform,opacity,colors,border-color,background-color]',
                  active
                    ? 'border-gold-500 bg-gold-500/10 shadow-sm'
                    : 'border-border/50 bg-card/50 hover:border-gold-500/40 hover:bg-card/80',
                )}
              >
                <span className="text-xs font-semibold text-foreground">{f.label}</span>
                <span className="text-base text-foreground/80" style={{ fontFamily: f.stack }}>
                  بوکزی — Abc
                </span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      {/* Margin width */}
      <SettingCard title="پهنای حاشیه" description="عرض ستون متن مطالعه.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MARGIN_WIDTHS.map((m) => {
            const active = r.marginWidth === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setReading('marginWidth', m.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-[transform,opacity,colors,border-color,background-color]',
                  active
                    ? 'border-gold-500 bg-gold-500/10 shadow-sm'
                    : 'border-border/50 bg-card/50 hover:border-gold-500/40 hover:bg-card/80',
                )}
              >
                <div className="flex h-8 w-full items-center justify-center">
                  <div
                    className={cn(
                      'h-1.5 rounded-full bg-gradient-to-l from-gold-500 to-amber-500',
                      m.bar,
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground">{m.label}</span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      {/* Reading theme picker */}
      <SettingCard title="تم مطالعه" description="رنگ پس‌زمینه و متن صفحات کتاب.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(READING_THEME_PREVIEW) as ReadingTheme[]).map((t) => {
            const p = READING_THEME_PREVIEW[t]
            const active = r.theme === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setReading('theme', t)}
                aria-pressed={active}
                aria-label={`تم ${p.label}`}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 p-3 text-center transition-[transform,opacity,colors,border-color,background-color]',
                  active
                    ? 'border-gold-500 shadow-md ring-2 ring-gold-500/20'
                    : 'border-border/50 hover:border-gold-500/40',
                )}
              >
                <div
                  className="mx-auto mb-2 h-16 w-full rounded-md border border-black/10 p-2"
                  style={{ background: p.bg, color: p.text }}
                >
                  <div className="space-y-1">
                    <div className="h-1 w-3/4 rounded-full" style={{ background: p.accent }} />
                    <div className="h-1 w-full rounded-full opacity-60" style={{ background: p.text }} />
                    <div className="h-1 w-2/3 rounded-full opacity-40" style={{ background: p.text }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground">{p.label}</span>
                {active && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'reading-theme-active'}
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-xl bg-gold-500/5"
                  />
                )}
              </button>
            )
          })}
        </div>
      </SettingCard>

      {/* Reading language */}
      <SettingCard title="زبان مطالعه و زیرنویس" description="زبان متن کتاب و زیرنویس را انتخاب کنید.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            { id: 'fa', label: 'فارسی', sub: 'متن اصلی فارسی' },
            { id: 'en', label: 'انگلیسی', sub: 'متن اصلی انگلیسی' },
            { id: 'fa-en', label: 'فارسی با زیرنویس انگلیسی', sub: 'متن فارسی، زیرنویس انگلیسی' },
            { id: 'en-fa', label: 'انگلیسی با زیرنویس فارسی', sub: 'متن انگلیسی، زیرنویس فارسی' },
          ] as { id: ReadingLanguage; label: string; sub: string }[]).map((l) => {
            const active = r.language === l.id
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setReading('language', l.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-right transition-[transform,opacity,colors,border-color,background-color]',
                  active
                    ? 'border-gold-500 bg-gold-500/10 shadow-sm'
                    : 'border-border/50 bg-card/50 hover:border-gold-500/40 hover:bg-card/80',
                )}
              >
                <span className="text-sm font-semibold text-foreground">{l.label}</span>
                <span className="text-[11px] text-muted-foreground">{l.sub}</span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      {/* Layout toggle */}
      <SettingCard title="نوع چیدمان" description="نحوه نمایش صفحات کتاب.">
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'paginated', label: 'صفحه‌به‌صفحه', hint: 'ورق زدن کلاسیک' },
            { id: 'continuous', label: 'پیمایش پیوسته', hint: 'اسکرول یکپارچه' },
          ] as { id: ReadingLayout; label: string; hint: string }[]).map((l) => {
            const active = r.layout === l.id
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setReading('layout', l.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-right transition-[transform,opacity,colors,border-color,background-color]',
                  active
                    ? 'border-gold-500 bg-gold-500/10 shadow-sm'
                    : 'border-border/50 bg-card/50 hover:border-gold-500/40 hover:bg-card/80',
                )}
              >
                <span className="text-sm font-semibold text-foreground">{l.label}</span>
                <span className="text-[11px] text-muted-foreground">{l.hint}</span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      {/* Reset to defaults */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            updateSection('reading', 'fontSize', DEFAULT_SETTINGS.reading.fontSize)
            updateSection('reading', 'lineHeight', DEFAULT_SETTINGS.reading.lineHeight)
            updateSection('reading', 'letterSpacing', DEFAULT_SETTINGS.reading.letterSpacing)
            updateSection('reading', 'fontFamily', DEFAULT_SETTINGS.reading.fontFamily)
            updateSection('reading', 'marginWidth', DEFAULT_SETTINGS.reading.marginWidth)
            updateSection('reading', 'theme', DEFAULT_SETTINGS.reading.theme)
            updateSection('reading', 'layout', DEFAULT_SETTINGS.reading.layout)
            updateSection('reading', 'dropCaps', DEFAULT_SETTINGS.reading.dropCaps)
            updateSection('reading', 'paragraphNumbers', DEFAULT_SETTINGS.reading.paragraphNumbers)
            toast.success('تنظیمات مطالعه بازنشانی شد')
          }}
        >
          <RotateCcw className="h-4 w-4" />
          بازنشانی به پیش‌فرض
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// 2. APPEARANCE SECTION
// ===========================================================================

function AppearanceSection() {
  const { resolvedTheme, theme, toggleTheme } = useThemeToggle()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const themes: {
    id: 'light' | 'dark' | 'system'
    label: string
    icon: LucideIcon
    bg: string
    text: string
  }[] = [
    { id: 'light', label: 'روشن', icon: Sun, bg: '#faf8f3', text: '#5f4b32' },
    { id: 'dark', label: 'تاریک', icon: Moon, bg: '#1a1814', text: '#e8e4dc' },
    { id: 'system', label: 'سیستم', icon: Monitor, bg: 'linear-gradient(135deg, #faf8f3 50%, #1a1814 50%)', text: '#a67f56' },
  ]

  const active = mounted ? (theme === 'system' ? 'system' : resolvedTheme) : 'light'

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Palette}
        title="ظاهر برنامه"
        description="تم برنامه و رنگ تاکیدی را انتخاب کنید."
      />

      <SettingCard title="تم برنامه" description="بین حالت روشن، تاریک یا سیستم جابه‌جا شوید.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themes.map((t) => {
            const isActive = active === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={(e) => toggleTheme(t.id, e)}
                aria-pressed={isActive}
                aria-label={`تم ${t.label}`}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 p-3 text-center transition-[transform,opacity,colors,border-color,background-color]',
                  isActive
                    ? 'border-gold-500 shadow-md ring-2 ring-gold-500/20'
                    : 'border-border/50 hover:border-gold-500/40',
                )}
              >
                <div
                  className="mx-auto mb-3 flex h-20 w-full items-center justify-center rounded-md border border-black/10"
                  style={{ background: t.bg, color: t.text }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-foreground">{t.label}</span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={(e) => {
            toggleTheme('light', e)
            toast.success('تنظیمات ظاهر بازنشانی شد')
          }}
        >
          <RotateCcw className="h-4 w-4" />
          بازنشانی
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// 3. NOTIFICATIONS SECTION
// ===========================================================================

function NotificationsSection() {
  const { settings, updateSection } = useSettings()
  const n = settings.notifications

  const setN = <K extends keyof typeof n>(key: K, value: (typeof n)[K]) => {
    updateSection('notifications', key, value)
    // When the user changes any notification setting, reset the banner-
    // dismissal so the permission banner can reappear if permission is
    // still 'default' (lets them re-trigger the request flow).
    setNotifBannerDismissed(false)
  }

  // Permission state. Hydrated on mount (client-only) to avoid SSR/CSR
  // mismatch. 'unsupported' if the browser lacks the Notifications API.
  const [permission, setPermission] = React.useState<NotificationPermissionState>('default')
  const [permissionLoaded, setPermissionLoaded] = React.useState(false)
  const [requesting, setRequesting] = React.useState(false)

  React.useEffect(() => {
    setPermission(getNotificationPermission())
    setPermissionLoaded(true)
  }, [])

  // Re-read permission when the window regains focus — the user may
  // have changed the site permission in browser settings.
  React.useEffect(() => {
    const onFocus = () => setPermission(getNotificationPermission())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const handleRequestPermission = async () => {
    setRequesting(true)
    try {
      const result = await requestNotificationPermission()
      setPermission(result)
      if (result === 'granted') {
        toast.success('اعلان‌ها فعال شدند', {
          description: 'از این پس یادآوری‌های مطالعه را دریافت خواهید کرد.',
        })
      } else if (result === 'denied') {
        toast.error('اعلان‌ها مسدود شدند', {
          description: 'برای فعال‌سازی، تنظیمات اعلان‌های مرورگر را بررسی کنید.',
        })
      }
    } finally {
      setRequesting(false)
    }
  }

  const handleTestNotification = () => {
    if (!notificationsSupported()) {
      toast.error('مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند', {
        description: 'از مرورگر دیگری استفاده کنید یا نسخه را به‌روز کنید.',
      })
      return
    }
    if (permission !== 'granted') {
      toast.info('ابتدا مجوز اعلان‌ها را فعال کنید', {
        description: 'روی «درخواست مجوز اعلان‌ها» بزنید.',
      })
      return
    }
    const sent = sendTestNotification()
    if (sent) {
      toast.success('اعلان آزمایشی ارسال شد', {
        description: 'اگر اعلان را ندید، تنظیمات سیستم را بررسی کنید.',
      })
    } else {
      toast.error('ارسال اعلان ناموفق بود', {
        description: 'ممکن است مرورگر اعلان‌های غیرپایدار را محدود کند.',
      })
    }
  }

  // Permission status badge — color + label depends on state.
  const permissionMeta = (() => {
    if (!notificationsSupported() || permission === 'unsupported') {
      return {
        label: 'پشتیبانی نمی‌شود',
        icon: XCircle,
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/30',
        hint: 'این مرورگر از اعلان‌های وب پشتیبانی نمی‌کند.',
      }
    }
    if (permission === 'granted') {
      return {
        label: 'فعال',
        icon: CheckCircle2,
        badgeClass:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30',
        hint: 'اعلان‌ها مجوز دارند و ارسال می‌شوند.',
      }
    }
    if (permission === 'denied') {
      return {
        label: 'مسدود',
        icon: XCircle,
        badgeClass:
          'bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/30',
        hint: 'اعلان‌ها مسدود شده‌اند. در تنظیمات مرورگر، مجوز این سایت را تغییر دهید.',
      }
    }
    return {
      label: 'هنوز پرسیده نشده',
      icon: BellRing,
      badgeClass:
        'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30',
      hint: 'برای دریافت یادآوری‌ها، ابتدا مجوز اعلان‌ها را فعال کنید.',
    }
  })()
  const PermissionIcon = permissionMeta.icon

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Bell}
        title="اعلان‌ها"
        description="یادآوری‌های مطالعه و هشدارهای مهم را مدیریت کنید."
      />

      {/* Permission status + request / test buttons */}
      <SettingCard
        title="مجوز اعلان‌ها"
        description="وضعیت دسترسی به اعلان‌های مرورگر را بررسی و مدیریت کنید."
        action={
          permissionLoaded ? (
            <Badge
              className={cn('gap-1 text-xs font-bold', permissionMeta.badgeClass)}
              aria-label={`وضعیت مجوز اعلان‌ها: ${permissionMeta.label}`}
            >
              <PermissionIcon className="h-3 w-3" aria-hidden="true" />
              {permissionMeta.label}
            </Badge>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" aria-hidden="true" />
            <span>{permissionMeta.hint}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {notificationsSupported() && permission !== 'granted' && (
              <Button
                type="button"
                size="sm"
                onClick={handleRequestPermission}
                disabled={requesting}
                className="gap-1.5"
                aria-label="درخواست مجوز اعلان‌ها"
              >
                <BellRing className="h-4 w-4" />
                {requesting ? 'در حال درخواست…' : 'درخواست مجوز اعلان‌ها'}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleTestNotification}
              disabled={!notificationsSupported() || permission !== 'granted'}
              className="gap-1.5"
              aria-label="آزمایش اعلان"
            >
              <Bell className="h-4 w-4" />
              آزمایش اعلان
            </Button>
          </div>
        </div>
      </SettingCard>

      {/* Daily reminder */}
      <SettingCard title="یادآوری روزانه">
        <div className="space-y-3">
          <SwitchRow
            title="یادآوری روزانه مطالعه"
            description="هر روز در زمان مشخصی به شما یادآوری می‌شود تا بخوانید."
            checked={n.dailyReminder}
            onChange={(v) => setN('dailyReminder', v)}
            ariaLabel="یادآوری روزانه مطالعه"
          />
          {n.dailyReminder && (
            <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
              <TimePicker24
                value={n.reminderTime}
                onChange={(val) => setN('reminderTime', val)}
                ariaLabel="زمان یادآوری"
              />
              <div>
                <Label htmlFor="reminder-time" className="text-sm font-semibold">
                  زمان یادآوری
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ساعت دلخواه خود را برای یادآوری انتخاب کنید.
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingCard>

      {/* Streak protection */}
      <SettingCard title="محافظت از زنجیره">
        <div className="space-y-3">
          <SwitchRow
            title="هشدار حفظ زنجیره"
            description="اگر امروز نخوانده باشی و زنجیره‌ات در خطر قطع باشد، هشداری دریافت می‌کنی."
            checked={n.streakAlerts}
            onChange={(v) => setN('streakAlerts', v)}
            ariaLabel="هشدار حفظ زنجیره"
          />
          {n.streakAlerts && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
              <div>
                <Label htmlFor="streak-alerts-time" className="text-sm font-semibold">
                  زمان هشدار زنجیره
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  زمانی که در صورت نخواندن، هشدار حفظ زنجیره ارسال می‌شود (پیش‌فرض ۲۰:۰۰).
                </p>
              </div>
              <TimePicker24
                value={n.streakAlertsTime}
                onChange={(val) => setN('streakAlertsTime', val)}
                ariaLabel="زمان هشدار زنجیره"
              />
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              این هشدار فقط در صورتی ارسال می‌شود که امروز هنوز مطالعه نکرده باشی — تا
              پیش از نیمه‌شب فرصت داری زنجیره را حفظ کنی.
            </span>
          </div>
        </div>
      </SettingCard>

      {/* Achievements + Level-up */}
      <SettingCard title="دستاوردها و سطح">
        <div className="space-y-2">
          <SwitchRow
            title="اعلان دستاوردهای جدید"
            description="هنگام باز شدن دستاورد جدید، یک اعلان برایت نمایش داده می‌شود."
            checked={n.achievementAlerts}
            onChange={(v) => setN('achievementAlerts', v)}
            ariaLabel="اعلان دستاوردهای جدید"
          />
          <SwitchRow
            title="اعلان رسیدن به سطح جدید"
            description="وقتی به سطح جدیدی می‌رسی، اعلانی برای تبریک دریافت می‌کنی."
            checked={n.levelUpAlerts}
            onChange={(v) => setN('levelUpAlerts', v)}
            ariaLabel="اعلان رسیدن به سطح جدید"
          />
        </div>
      </SettingCard>

      {/* Reports + new books */}
      <SettingCard title="گزارش‌ها و کتاب‌های جدید">
        <div className="space-y-2">
          <SwitchRow
            title="گزارش هفتگی"
            description="هر هفته خلاصه‌ای از پیشرفت مطالعه خود دریافت کنید."
            checked={n.weeklyReport}
            onChange={(v) => setN('weeklyReport', v)}
            ariaLabel="گزارش هفتگی"
          />
          <SwitchRow
            title="اعلان کتاب‌های جدید"
            description="از کتاب‌های جدید مرتبط با علاقه‌مندی‌های شما مطلع شوید."
            checked={n.newBookAlerts}
            onChange={(v) => setN('newBookAlerts', v)}
            ariaLabel="اعلان کتاب‌های جدید"
          />
        </div>
      </SettingCard>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleTestNotification}
          disabled={!notificationsSupported() || permission !== 'granted'}
          aria-label="آزمایش اعلان"
        >
          <Bell className="h-4 w-4" />
          آزمایش اعلان
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// 4. ACCESSIBILITY SECTION
// ===========================================================================

function AccessibilitySection() {
  const { settings, updateSection } = useSettings()
  const a = settings.accessibility

  const setA = <K extends keyof typeof a>(key: K, value: (typeof a)[K]) =>
    updateSection('accessibility', key, value)

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Accessibility}
        title="دسترسی‌پذیری"
        description="تجربه برنامه را متناسب با نیازهای خود شخصی‌سازی کنید."
      />

      <SettingCard title="حرکت و کنتراست">
        <div className="space-y-2">
          <SwitchRow
            title="کاهش حرکت"
            description="غیرفعال کردن انیمیشن‌ها و جلوه‌های بصری در سراسر برنامه."
            checked={a.reducedMotion}
            onChange={(v) => setA('reducedMotion', v)}
            ariaLabel="کاهش حرکت"
          />
          <SwitchRow
            title="کنتراست بالا"
            description="افزایش کنتراست متن و پس‌زمینه برای خوانایی بهتر."
            checked={a.highContrast}
            onChange={(v) => setA('highContrast', v)}
            ariaLabel="کنتراست بالا"
          />
          <SwitchRow
            title="متن بزرگ"
            description="افزایش اندازه فونت پایه در کل برنامه."
            checked={a.largeText}
            onChange={(v) => setA('largeText', v)}
            ariaLabel="متن بزرگ"
          />
        </div>
      </SettingCard>

      <SettingCard title="صفحه‌خوان و فوکوس">
        <div className="space-y-2">
          <SwitchRow
            title="بهینه‌سازی صفحه‌خوان"
            description="پنهان کردن عناصر تزئینی برای تجربه بهتر با صفحه‌خوان."
            checked={a.screenReaderOptimized}
            onChange={(v) => setA('screenReaderOptimized', v)}
            ariaLabel="بهینه‌سازی صفحه‌خوان"
          />
          <SwitchRow
            title="نشانگرهای فوکوس"
            description="نمایش دائمی حلقه فوکوس دور عناصر قابل انتخاب."
            checked={a.focusIndicators}
            onChange={(v) => setA('focusIndicators', v)}
            ariaLabel="نشانگرهای فوکوس"
          />
        </div>
      </SettingCard>


    </div>
  )
}

// ===========================================================================
// 5. PRIVACY SECTION
// ===========================================================================

function PrivacySection() {
  const { settings, updateSection } = useSettings()
  const p = settings.privacy

  const setP = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) =>
    updateSection('privacy', key, value)

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Shield}
        title="حریم خصوصی"
        description="کنترل کنید چه اطلاعاتی از شما به اشتراک گذاشته می‌شود."
      />

      <SettingCard title="اشتراک‌گذاری آمار">
        <div className="space-y-2">
          <SwitchRow
            title="اشتراک آمار مطالعه"
            description="مجموع صفحات خوانده‌شده و زنجیره روزانه شما در لیدربورد نمایش داده می‌شود."
            checked={p.shareStats}
            onChange={(v) => setP('shareStats', v)}
            ariaLabel="اشتراک آمار مطالعه"
          />
          <SwitchRow
            title="اشتراک تاریخچه مطالعه"
            description="کتاب‌هایی که می‌خوانید در پروفایل عمومی شما نمایش داده می‌شود."
            checked={p.shareReadingHistory}
            onChange={(v) => setP('shareReadingHistory', v)}
            ariaLabel="اشتراک تاریخچه مطالعه"
          />
        </div>
      </SettingCard>

      <SettingCard title="نمایش پروفایل">
        <div className="space-y-2">
          <SwitchRow
            title="پروفایل عمومی"
            description="پروفایل شما برای سایر کاربران قابل مشاهده است."
            checked={p.publicProfile}
            onChange={(v) => setP('publicProfile', v)}
            ariaLabel="پروفایل عمومی"
          />
          <SwitchRow
            title="حضور در لیدربورد"
            description="نام و امتیاز شما در جدول برترین‌ها نمایش داده می‌شود."
            checked={p.showInLeaderboard}
            onChange={(v) => setP('showInLeaderboard', v)}
            ariaLabel="حضور در لیدربورد"
          />
        </div>
      </SettingCard>


    </div>
  )
}


// ===========================================================================
// 7. DATA SECTION
// ===========================================================================

function DataSection() {
  const locale = usePersianLocale()
  const { status } = useSession()
  const isAuthed = status === 'authenticated'
  const [storageBytes, setStorageBytes] = React.useState(0)
  const [clearAllOpen, setClearAllOpen] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [importOpen, setImportOpen] = React.useState(false)
  const [importJson, setImportJson] = React.useState('')
  const [serverExporting, setServerExporting] = React.useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const refreshStorage = React.useCallback(async () => {
    if (typeof window === 'undefined') return
    let total = 0
    
    // 1. Calculate localStorage size
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('ky_')) continue
      const v = localStorage.getItem(k) ?? ''
      total += k.length + v.length
    }
    
    // 2. Calculate IndexedDB size
    try {
      const { entries } = await import('idb-keyval')
      const idbEntries = await entries()
      for (const [k, v] of idbEntries) {
        if (typeof k === 'string' && k.startsWith('ky_')) {
          total += k.length
          const serialized = typeof v === 'string' ? v : JSON.stringify(v)
          total += serialized.length
        }
      }
    } catch {
      // Ignore idb errors silently
    }
    
    setStorageBytes(total)
  }, [])

  React.useEffect(() => {
    refreshStorage()
  }, [refreshStorage])

  const mb = storageBytes / (1024 * 1024)
  const kb = storageBytes / 1024
  const sizeLabel = mb >= 1 
    ? locale.toPersianDigits(mb.toFixed(2)) + ' مگابایت' 
    : kb < 1 
      ? locale.toPersianDigits(storageBytes.toString()) + ' بایت' 
      : locale.toPersianDigits(kb.toFixed(1)) + ' کیلوبایت'

  async function handleExport() {
    if (typeof window === 'undefined') return
    try {
      const dump: Record<string, unknown> = { _exportedAt: new Date().toISOString(), _app: SITE.nameEn }
      
      // 1. Get localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k || !k.startsWith('ky_')) continue
        const raw = localStorage.getItem(k)
        if (!raw) continue
        try { dump[k] = JSON.parse(raw) } catch { dump[k] = raw }
      }

      // 2. Get IndexedDB keys
      const idbEntries = await import('idb-keyval').then(m => m.entries())
      for (const [k, v] of idbEntries) {
        if (typeof k === 'string' && k.startsWith('ky_')) {
          try { dump[k] = typeof v === 'string' ? JSON.parse(v) : v } catch { dump[k] = v }
        }
      }

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `bookzi-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('داده‌ها در فایل JSON ذخیره شد')
    } catch {
      toast.error('خطا در پشتیبان‌گیری')
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setImportJson(text)
      setImportOpen(true)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function applyImport() {
    try {
      const parsed = JSON.parse(importJson) as Record<string, unknown>
      let count = 0
      const { set } = await import('idb-keyval')
      
      for (const [k, v] of Object.entries(parsed)) {
        if (!k.startsWith('ky_')) continue
        const serialized = typeof v === 'string' ? v : JSON.stringify(v)
        // Store in both to be safe during migration
        localStorage.setItem(k, serialized)
        await set(k, serialized)
        count++
      }
      refreshStorage()
      setImportOpen(false)
      setImportJson('')
      toast.success(`${locale.toPersianDigits(count)} کلید بازیابی شد`)
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error('فایل JSON معتبر نیست')
    }
  }

  async function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEYS.progress)
      localStorage.removeItem(STORAGE_KEYS.readingHistory)
      localStorage.removeItem(STORAGE_KEYS.readerSessionHistory)
      
      const { del } = await import('idb-keyval')
      await del(STORAGE_KEYS.progress)
      await del(STORAGE_KEYS.readingHistory)
      await del(STORAGE_KEYS.readerSessionHistory)

      if (isAuthed) {
        await fetch('/api/reading/progress/clear', { method: 'DELETE' })
      }

      refreshStorage()
      toast.success('پیشرفت مطالعه پاک شد')
    } catch {
      toast.error('خطا در پاک‌سازی')
    }
  }

  async function clearVocab() {
    try {
      localStorage.removeItem(STORAGE_KEYS.srs)
      localStorage.removeItem(STORAGE_KEYS.vocabCategories)
      localStorage.removeItem(STORAGE_KEYS.vocabWordMeta)
      localStorage.removeItem(STORAGE_KEYS.vocabActivity)
      localStorage.removeItem(STORAGE_KEYS.vocabDailyWordsDate)
      localStorage.removeItem(STORAGE_KEYS.practiceStats)

      const { del } = await import('idb-keyval')
      await del(STORAGE_KEYS.srs)
      await del(STORAGE_KEYS.vocabCategories)
      await del(STORAGE_KEYS.vocabWordMeta)
      await del(STORAGE_KEYS.vocabActivity)
      await del(STORAGE_KEYS.vocabDailyWordsDate)
      await del(STORAGE_KEYS.practiceStats)

      if (isAuthed) {
        await fetch('/api/vocabulary/clear', { method: 'DELETE' })
      }

      refreshStorage()
      toast.success('واژگان پاک شد')
    } catch {
      toast.error('خطا در پاک‌سازی')
    }
  }

  async function clearAll() {
    try {
      clearAllKyStorage()
      
      const { clear } = await import('idb-keyval')
      await clear()

      if (isAuthed) {
        await fetch('/api/reading/progress/clear', { method: 'DELETE' })
        await fetch('/api/vocabulary/clear', { method: 'DELETE' })
      }

      refreshStorage()
      setClearAllOpen(false)
      setConfirmText('')
      toast.success('تمام داده‌های محلی و سرور پاک شد')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error('خطا در پاک‌سازی')
    }
  }

  /**
   * Trigger a server-side GDPR data export. Fetches `/api/account/export`
   * (which requires auth) and downloads the returned JSON blob. The server
   * sets `Content-Disposition: attachment` so browsers will save it
   * directly — but we also create a Blob + anchor link to support
   * `Cache-Control: no-store` responses that some browsers refuse to save
   * without an explicit user-gesture anchor.
   */
  async function handleServerExport() {
    if (!isAuthed) {
      toast.error('برای خروجی داده‌های سرور، ابتدا وارد شوید.')
      return
    }
    setServerExporting(true)
    try {
      const res = await fetch('/api/account/export', { credentials: 'include' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'خروجی ناموفق بود')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `bookzi-data-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('داده‌های سرور دانلود شد')
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'خروجی داده‌های سرور ناموفق بود'))
    } finally {
      setServerExporting(false)
    }
  }

  /**
   * Self-serve account deletion (GDPR Art. 17). POSTs to
   * `/api/account/delete` and on success signs the user out via
   * `next-auth/react`'s `signOut()` helper, then redirects home.
   */
  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm }),
        credentials: 'include',
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        throw new Error(j?.error || 'حذف حساب ناموفق بود')
      }
      toast.success('حساب شما حذف شد. خدانگهدار.')
      setDeleteAccountOpen(false)
      setDeleteConfirm('')
      // Sign out + redirect home. The server session is already invalid
      // (the user row was deleted), but we still call signOut to clear
      // the client-side session cookie + redirect cleanly.
      setTimeout(() => {
        signOut({ callbackUrl: '/' })
      }, 600)
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'حذف حساب ناموفق بود'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Database}
        title="مدیریت داده"
        description="از داده‌های خود نسخه پشتیبان بگیرید یا آن‌ها را پاک کنید."
      />

      {/* Storage usage */}
      <SettingCard title="حجم ذخیره‌سازی">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700 dark:text-gold-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">داده محلی</p>
              <p className="text-xs text-muted-foreground">روی این مرورگر ذخیره شده</p>
            </div>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {sizeLabel} استفاده شده
          </Badge>
        </div>
      </SettingCard>

      {/* Export / Import */}
      <SettingCard
        title="پشتیبان‌گیری و بازیابی"
        description="نسخه پشتیبان از داده‌های محلی این مرورگر، یا خروجی کامل داده‌های سرور (GDPR)."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            خروجی داده‌های محلی
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            ورود داده‌ها
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="sr-only"
            aria-label="انتخاب فایل پشتیبان JSON"
          />
        </div>
        {/* Server-side GDPR data export */}
        <Separator className="my-4" />
        <div className="flex flex-col gap-3 rounded-xl border border-gold-500/30 bg-gold-500/5 p-4 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="gap-2 border-gold-500/40 text-gold-700 hover:bg-gold-500/10 dark:text-gold-400 shrink-0"
            onClick={handleServerExport}
            disabled={!isAuthed || serverExporting}
          >
            <Download className="h-4 w-4" />
            {serverExporting ? 'در حال آماده‌سازی...' : 'دانلود داده‌های سرور'}
          </Button>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-gold-700 dark:text-gold-400" aria-hidden="true" />
              دانلود داده‌های من (GDPR)
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              خروجی کامل از داده‌های سمت سرور شما — پروفایل، نقد‌ها، پیشرفت مطالعه،
              جلسات خواندن، آمار، واژگان و تصاویر بارگذاری‌شده. مطابق با حق قابلیت
              انتقال داده (GDPR Art. 20).
            </p>
            {!isAuthed && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                برای دانلود داده‌های سرور، ابتدا وارد حساب کاربری شوید.
              </p>
            )}
          </div>
        </div>
      </SettingCard>

      {/* Danger zone */}
      <SettingCard title="منطقه خطر">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 p-4 sm:flex-row sm:items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                  پاک‌سازی
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>پاک کردن پیشرفت مطالعه؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    تمام پیشرفت مطالعه، تاریخچه روزانه و جلسات خواندن پاک می‌شود. این عمل قابل بازگشت نیست.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearProgress}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    بله، پاک کن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div>
              <p className="text-sm font-semibold text-foreground">پاک کردن پیشرفت مطالعه</p>
              <p className="text-xs text-muted-foreground">
                تمام پیشرفت خواندن کتاب‌ها و تاریخچه روزانه پاک می‌شود.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 p-4 sm:flex-row sm:items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                  پاک‌سازی
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>پاک کردن واژگان؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    تمام واژگان ذخیره‌شده، دسته‌بندی‌ها، آمار تمرین و فعالیت روزانه پاک می‌شود. این عمل قابل بازگشت نیست.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearVocab}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    بله، پاک کن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div>
              <p className="text-sm font-semibold text-foreground">پاک کردن واژگان</p>
              <p className="text-xs text-muted-foreground">
                همه واژگان ذخیره‌شده، دسته‌بندی‌ها و آمار تمرین پاک می‌شود.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setClearAllOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              پاک‌سازی کامل
            </Button>
            <div>
              <p className="text-sm font-bold text-destructive">پاک کردن همه داده‌ها</p>
              <p className="text-xs text-muted-foreground">
                تمام داده‌های محلی پاک می‌شود. این عمل قابل بازگشت نیست!
              </p>
            </div>
          </div>

          {/* Account self-deletion (GDPR Art. 17) */}
          <div className="flex flex-col gap-3 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center">
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={!isAuthed}
              onClick={() => setDeleteAccountOpen(true)}
            >
              <UserX className="h-4 w-4" />
              حذف حساب
            </Button>
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-bold text-destructive">
                <UserX className="h-4 w-4" aria-hidden="true" />
                حذف حساب کاربری
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                حساب کاربری شما به‌همراه تمام داده‌های سمت سرور (نقد‌ها، پیشرفت، آمار،
                جلسات خواندن و تصاویر بارگذاری‌شده) برای همیشه حذف می‌شود. این عمل
                قابل بازگشت نیست. مطابق با حق فراموشی (GDPR Art. 17).
              </p>
              {!isAuthed && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  برای حذف حساب، ابتدا وارد حساب کاربری شوید.
                </p>
              )}
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Account deletion confirmation dialog (type-to-confirm) */}
      <Dialog
        open={deleteAccountOpen}
        onOpenChange={(o) => {
          setDeleteAccountOpen(o)
          if (!o) setDeleteConfirm('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              حذف دائمی حساب کاربری؟
            </DialogTitle>
            <DialogDescription>
              این عمل تمام داده‌های سمت سرور شما — پروفایل، نقد‌ها، پیشرفت مطالعه،
              آمار، جلسات خواندن و تصاویر بارگذاری‌شده — را برای همیشه پاک می‌کند.
              نقد‌های شما روی کتاب‌ها باقی می‌مانند اما نام کاربری شما از آن‌ها
              جدا می‌شود. برای تایید، لطفاً
              <strong className="px-1 text-destructive">حذف حساب</strong>
              را در کادر زیر وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="حذف حساب"
            aria-label="تایید با تایپ حذف حساب"
            className="w-full"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccountOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm.trim() !== 'حذف حساب' || deleting}
              onClick={handleDeleteAccount}
              className="gap-1.5"
            >
              {deleting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  حذف دائمی حساب
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بازیابی داده‌ها</DialogTitle>
            <DialogDescription>
              فایل پشتیبان شما بارگذاری شد. آیا می‌خواهید داده‌های فعلی را با این فایل جایگزین کنید؟
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto rounded-md border border-border/50 bg-card/50 p-3">
            <pre className="text-[10px] leading-tight text-muted-foreground">
              {importJson.slice(0, 800)}
              {importJson.length > 800 ? '\n…' : ''}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              انصراف
            </Button>
            <Button onClick={applyImport} className="gap-1.5">
              <Upload className="h-4 w-4" />
              بازیابی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear-all confirmation dialog (type-to-confirm) */}
      <Dialog open={clearAllOpen} onOpenChange={(o) => { setClearAllOpen(o); if (!o) setConfirmText('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پاک کردن همه داده‌ها؟</DialogTitle>
            <DialogDescription>
              این عمل تمام داده‌های محلی شما — پیشرفت، واژگان، دستاوردها، تنظیمات و
              علاقه‌مندی‌ها — را به‌طور دائمی پاک می‌کند. برای تایید، لطفاً
              <strong className="px-1 text-destructive">حذف</strong>
              را در کادر زیر وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="حذف"
            aria-label="تایید با تایپ حذف"
            className="w-full"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim() !== 'حذف'}
              onClick={clearAll}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              پاک‌سازی کامل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// 8. ABOUT SECTION
// ===========================================================================

/**
 * "Reset onboarding" row — clears the `ky_onboarding` localStorage entry
 * and reloads the page so the OnboardingTrigger re-mounts and shows the
 * wizard. Wrapped in an AlertDialog confirmation because it discards the
 * user's saved level/genre/first-book choices (they'll re-pick them).
 */
function ResetOnboardingRow() {
  const [open, setOpen] = React.useState(false)
  const reduceMotion = useReducedMotion()

  function onConfirm() {
    resetOnboarding()
    toast.success('راهنمای معرفی بازنشانی شد. به‌زودی دوباره نمایش داده می‌شود.')
    // Slight delay so the toast is visible before the reload navigates
    // away from the page.
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <>
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-4 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setOpen(true)}
        >
          <PartyPopper className="h-4 w-4" />
          بازنشانی معرفی
        </Button>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            اجرای دوباره راهنمای شروع
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            انتخاب‌های قبلی شما (سطح، ژانرها، کتاب اول) پاک می‌شود و راهنما
            دوباره از ابتدا نمایش داده می‌شود.
          </p>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازنشانی راهنمای معرفی؟</AlertDialogTitle>
            <AlertDialogDescription>
              انتخاب‌های قبلی شما در راهنمای شروع (سطح زبان، ژانرهای موردعلاقه
              و کتاب اول) پاک می‌شود. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={cn(
                'bg-gradient-to-r from-gold-600 to-amber-600 text-white shadow-md hover:from-gold-700 hover:to-amber-700',
                reduceMotion && 'transition-none',
              )}
            >
              بله، بازنشانی کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AboutSection() {
  const locale = usePersianLocale()

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Info}
        title="درباره بوکزی"
        description="اطلاعات نسخه، اعتبارها و پیوندهای مفید."
      />

      <SettingCard>
        <div className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:text-right">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h3 className="text-xl font-extrabold tracking-tight">{SITE.name}</h3>
              <Badge variant="secondary" className="tabular-nums">
                نسخه {locale.toPersianDigits('1.0.0')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{SITE.description}</p>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="پیوندها">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/about">
              <Info className="h-4 w-4" />
              درباره ما
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/help">
              <BookOpen className="h-4 w-4" />
              راهنما
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <Link href="/support">
              <Heart className="h-4 w-4" />
              پشتیبانی
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start gap-2">
            <a href={`mailto:${SITE.email}`}>
              <Sparkles className="h-4 w-4" />
              تماس با ما
            </a>
          </Button>
        </div>
      </SettingCard>

      <SettingCard
        title="بازنشانی معرفی"
        description="اجرای دوباره راهنمای شروع کار برای انتخاب دوباره سطح، ژانرها و کتاب اول."
      >
        <ResetOnboardingRow />
      </SettingCard>

      <SettingCard title="اعتبارها">
        <p className="text-sm leading-relaxed text-muted-foreground">
          بوکزی با عشق و باور به قدرت خواندن ساخته شده است. متون دوزبانه این
          پلتفرم از منابع آزاد گردآوری شده و برای تجربه‌ای روان بهینه شده‌اند.
        </p>
        <Separator className="my-3" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
          ساخته‌شده برای عاشقان کتاب
        </div>
      </SettingCard>

      <p className="text-center text-xs text-muted-foreground">
        © {locale.toPersianDigits(new Date().getFullYear())} {SITE.name} —
        تمامی حقوق محفوظ است.
      </p>
    </div>
  )
}

// ===========================================================================
// Main page client
// ===========================================================================

export function SettingsPageClient() {
  const reduceMotion = useReducedMotion()
  const [activeSection, setActiveSection] = React.useState<SectionId>('reading')

  // Toast on every settings change is handled inside each setter; here we
  // expose a single "saved" feedback for tab switches (none for now).

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.header
        initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            داشبورد
          </Link>
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground">تنظیمات</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30">
            <SettingsIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              تنظیمات
            </h1>
            <p className="text-sm text-muted-foreground">
              همه ترجیحات برنامه بوکزی در یک جا — ظاهر، مطالعه، اعلان‌ها و داده.
            </p>
          </div>
        </div>
      </motion.header>

      <Tabs
        value={activeSection}
        onValueChange={(v) => setActiveSection(v as SectionId)}
        className="grid gap-6 lg:grid-cols-[220px_1fr]"
      >
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <TabsList
            aria-label="بخش‌های تنظیمات"
            className="flex h-auto w-full flex-col items-stretch gap-1 bg-card/60 p-2"
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="flex h-auto items-center justify-start gap-2.5 px-3 py-2.5 text-right data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-700 dark:data-[state=active]:text-gold-400"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex flex-col items-start text-right">
                    <span className="text-sm font-semibold">{s.label}</span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden">
          <TabsList
            aria-label="بخش‌های تنظیمات (موبایل)"
            className="flex h-auto w-full flex-wrap gap-1 bg-card/60 p-1.5"
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="flex h-auto items-center gap-1.5 px-2.5 py-2 text-xs data-[state=active]:bg-gold-500/15 data-[state=active]:text-gold-700 dark:data-[state=active]:text-gold-400"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {s.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Section content */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <TabsContent value="reading" className="mt-0 focus-visible:outline-none">
                <ReadingSection />
              </TabsContent>
              <TabsContent value="appearance" className="mt-0 focus-visible:outline-none">
                <AppearanceSection />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
                <NotificationsSection />
              </TabsContent>
              <TabsContent value="accessibility" className="mt-0 focus-visible:outline-none">
                <AccessibilitySection />
              </TabsContent>
              <TabsContent value="privacy" className="mt-0 focus-visible:outline-none">
                <PrivacySection />
              </TabsContent>
              <TabsContent value="data" className="mt-0 focus-visible:outline-none">
                <DataSection />
              </TabsContent>
              <TabsContent value="about" className="mt-0 focus-visible:outline-none">
                <AboutSection />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}
