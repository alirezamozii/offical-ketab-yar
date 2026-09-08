'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  Contrast,
  Moon,
  ScrollText,
  Sun,
  X,
} from 'lucide-react'
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store'
import { cn } from '@/lib/utils'
import type {
  ReaderFontFamily,
  ReadingPreferences,
  ReaderTheme,
} from '@/lib/reader/types'
import { THEME_STYLES, toPersianDigits } from '@/lib/reader/types'

interface SettingsPanelProps {
  prefs: ReadingPreferences
  onChange: <K extends keyof ReadingPreferences>(
    key: K,
    value: ReadingPreferences[K],
  ) => void
  theme: ReaderTheme
  open: boolean
  onClose: () => void
}

/**
 * The reader settings drawer. Owns every "reading experience" knob:
 * theme preset, font family + size + line-height + letter-spacing, column
 * width + margin density, layout mode (continuous vs paginated), subtitles,
 * paragraph numbers, and auto-scroll speed. Every change flows through
 * `onChange` → `useReadingPreferences`, which persists to `STORAGE_KEYS.readerPrefs`.
 */
export function SettingsPanel({
  prefs,
  onChange,
  theme,
  open,
  onClose,
}: SettingsPanelProps) {
  const s = THEME_STYLES[theme]
  const voiceId = useReaderSettingsStore((state) => state.voiceId)
  const setVoiceId = useReaderSettingsStore((state) => state.setVoiceId)

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 border-e-2 p-0 sm:max-w-md"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <SheetTitle className="sr-only">تنظیمات مطالعه</SheetTitle>
        <SheetDescription className="sr-only">
          تنظیمات قلم، فاصله خطوط، طرح پس‌زمینه و حالت نمایش متن.
        </SheetDescription>

        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: s.border }}
        >
          <h2 className="text-lg font-bold" aria-hidden>تنظیمات مطالعه</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="flex-1 space-y-6 overflow-y-auto scroll-warm px-5 py-5 pb-safe"
          style={{ maxHeight: 'calc(100dvh - 8rem)' }}
        >
          {/* ---- Theme presets (day / night / sepia / high-contrast) ---- */}
          <Group label="پس‌زمینه">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'light' as const, label: 'روز', Icon: Sun },
                  { id: 'sepia' as const, label: 'سپیا', Icon: ScrollText },
                  { id: 'dark' as const, label: 'شب', Icon: Moon },
                  {
                    id: 'high-contrast' as const,
                    label: 'کنتراست بالا',
                    Icon: Contrast,
                  },
                ]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChange('theme', t.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 p-3 text-xs font-medium transition-[transform,opacity,colors,border-color,background-color]',
                    prefs.theme === t.id
                      ? 'ring-2'
                      : 'opacity-70 hover:opacity-100',
                  )}
                  style={{
                    borderColor: prefs.theme === t.id ? s.accent : s.border,
                    ...(prefs.theme === t.id
                      ? { boxShadow: `0 0 0 2px ${s.accent}55` }
                      : {}),
                    background:
                      t.id === 'light'
                        ? '#faf8f3'
                        : t.id === 'sepia'
                          ? '#f4ecd8'
                          : t.id === 'dark'
                            ? '#1a1814'
                            : '#000000',
                    color:
                      t.id === 'dark' || t.id === 'high-contrast'
                        ? '#e8e4dc'
                        : t.id === 'sepia'
                          ? '#5f4b32'
                          : '#2a2a2a',
                  }}
                >
                  <t.Icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </Group>

          <Separator />

          {/* ---- Font family ---- */}
          <Group label="قلم متن">
            <SegmentedThree
              value={prefs.fontFamily}
              onChange={(v) => onChange('fontFamily', v as ReaderFontFamily)}
              options={[
                { id: 'vazirmatn', label: 'وزیر' },
                { id: 'serif', label: 'سریف' },
                { id: 'sans', label: 'سنز' },
              ]}
              accent={s.accent}
              border={s.border}
            />
          </Group>

          <Separator />

          {/* ---- Font size ---- */}
          <Group label={`اندازه قلم: ${toPersianDigits(prefs.fontSize)}px`}>
            <Slider
              value={[prefs.fontSize]}
              min={14}
              max={32}
              step={1}
              onValueChange={(v) => onChange('fontSize', v[0])}
              aria-label="اندازه قلم"
            />
            <div className="flex justify-between text-[11px] opacity-60">
              <span>۱۴px</span>
              <span>۳۲px</span>
            </div>
          </Group>

          <Separator />

          {/* ---- Line height ---- */}
          <Group label={`فاصله خطوط: ${toPersianDigits(prefs.lineHeight.toFixed(1))}`}>
            <Slider
              value={[prefs.lineHeight * 10]}
              min={14}
              max={22}
              step={1}
              onValueChange={(v) => onChange('lineHeight', v[0] / 10)}
              aria-label="فاصله خطوط"
            />
            <div className="flex justify-between text-[11px] opacity-60">
              <span>۱٫۴</span>
              <span>۲٫۲</span>
            </div>
          </Group>

          <Separator />

          {/* ---- Letter spacing ---- */}
          <Group
            label={`فاصله حروف: ${toPersianDigits(
              (prefs.letterSpacing * 100).toFixed(0),
            )}/۱۰۰ em`}
          >
            <Slider
              value={[Math.round(prefs.letterSpacing * 1000)]}
              min={-50}
              max={50}
              step={5}
              onValueChange={(v) => onChange('letterSpacing', v[0] / 1000)}
              aria-label="فاصله حروف"
            />
            <div className="flex justify-between text-[11px] opacity-60">
              <span>فشرده</span>
              <span>گشاده</span>
            </div>
          </Group>

          <Separator />

          {/* ---- Column width (acts as container max-width) ---- */}
          <Group label="پهنای کادر متن">
            <SegmentedThree
              value={prefs.columnWidth}
              onChange={(v) => onChange('columnWidth', v)}
              options={[
                { id: 'narrow', label: 'باریک', Icon: AlignLeft },
                { id: 'normal', label: 'متوسط', Icon: AlignCenter },
                { id: 'wide', label: 'عریض', Icon: AlignJustify },
              ]}
              accent={s.accent}
              border={s.border}
            />
          </Group>

          <Separator />

          {/* ---- Paragraph spacing / Margin density ---- */}
          <Group label="فاصله بین پاراگراف‌ها">
            <SegmentedThree
              value={prefs.margin}
              onChange={(v) => onChange('margin', v)}
              options={[
                { id: 'compact', label: 'فشرده' },
                { id: 'normal', label: 'استاندارد' },
                { id: 'comfortable', label: 'باز و راحت' },
              ]}
              accent={s.accent}
              border={s.border}
            />
          </Group>

          <Separator />

          {/* ---- Subtitles toggle ---- */}
          <ToggleRow
            label="نمایش ترجمه"
            hint="نمایش ترجمه فارسی زیر هر بند"
            active={prefs.showSubtitles}
            accent={s.accent}
            border={s.border}
            onToggle={() => onChange('showSubtitles', !prefs.showSubtitles)}
          />

          <Separator />

          {/* ---- Audio / TTS Settings ---- */}
          <Group label="صدای گوینده (TTS)">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold opacity-70">انتخاب گوینده انگلیسی</span>
                <SegmentedThree
                  value={voiceId.startsWith('en') ? voiceId : 'en-US-AvaMultilingualNeural'}
                  onChange={(v) => setVoiceId(v)}
                  options={[
                    { id: 'en-US-AvaMultilingualNeural', label: 'آوا (زن)' },
                    { id: 'en-US-AndrewMultilingualNeural', label: 'اندرو (مرد)' },
                  ]}
                  accent={s.accent}
                  border={s.border}
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold opacity-70">انتخاب گوینده فارسی</span>
                <SegmentedThree
                  value={voiceId.startsWith('fa') ? voiceId : 'fa-IR-DilaraNeural'}
                  onChange={(v) => setVoiceId(v)}
                  options={[
                    { id: 'fa-IR-DilaraNeural', label: 'دیلارا (زن)' },
                    { id: 'fa-IR-FaridNeural', label: 'فرید (مرد)' },
                  ]}
                  accent={s.accent}
                  border={s.border}
                />
              </div>
            </div>
          </Group>
        </div>

        <div
          className="border-t px-5 py-3 text-center text-[11px] opacity-60"
          style={{ borderColor: s.border }}
        >
          تنظیمات به‌صورت خودکار ذخیره می‌شود.
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold opacity-80">{label}</label>
      {children}
    </div>
  )
}

interface SegOption<T extends string> {
  id: T
  label: string
  Icon?: React.ComponentType<{ className?: string }>
}

function SegmentedThree<T extends string>({
  value,
  onChange,
  options,
  accent,
  border,
}: {
  value: T
  onChange: (v: T) => void
  options: SegOption<T>[]
  accent: string
  border: string
}) {
  return (
    <div
      className="grid gap-1.5 rounded-lg border-2 p-1"
      style={{
        borderColor: border,
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-[transform,opacity,colors,border-color,background-color]',
              active ? 'shadow-sm' : 'opacity-65 hover:opacity-100',
            )}
            style={
              active ? { background: accent + '22', color: accent } : undefined
            }
          >
            {opt.Icon && <opt.Icon className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  active,
  accent,
  border,
  onToggle,
  Icon,
}: {
  label: string
  hint?: string
  active: boolean
  accent: string
  border: string
  onToggle: () => void
  Icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg border-2 p-3 text-start text-sm"
      style={{ borderColor: border }}
      role="switch"
      aria-checked={active}
    >
      <span className="flex flex-col">
        <span className="flex items-center gap-2 font-medium">
          {Icon && <Icon className="h-4 w-4 opacity-70" />}
          {label}
        </span>
        {hint && <span className="mt-0.5 text-[11px] opacity-60">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          active ? '' : 'opacity-50',
        )}
        style={{ background: active ? accent : border }}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[transform,opacity,colors,border-color,background-color]',
            active ? 'start-0.5' : 'start-5',
          )}
        />
      </span>
    </button>
  )
}
