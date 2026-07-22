'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReaderTheme } from '@/lib/reader/types'
import { THEME_STYLES } from '@/lib/reader/types'

interface ShortcutsHelpOverlayProps {
  theme: ReaderTheme
  onClose: () => void
}

interface ShortcutRow {
  keys: string[]
  action: string
}

const SHORTCUTS: { group: string; rows: ShortcutRow[] }[] = [
  {
    group: 'جابه‌جایی',
    rows: [
      { keys: ['←'], action: 'چپتر بعدی' },
      { keys: ['→'], action: 'چپتر قبلی' },
      { keys: ['j'], action: 'چپتر بعدی (سبک Vim)' },
      { keys: ['k'], action: 'چپتر قبلی (سبک Vim)' },
      { keys: ['Space'], action: 'یک صفحه پایین' },
      { keys: ['Shift', 'Space'], action: 'یک صفحه بالا' },
      { keys: ['Home'], action: 'ابتدای کتاب' },
      { keys: ['End'], action: 'انتهای کتاب' },
    ],
  },
  {
    group: 'حالت مطالعه',
    rows: [
      { keys: ['F'], action: 'حالت تمرکز (فقط متن)' },
      { keys: ['T'], action: 'نمایش/پنهان ترجمه' },
      { keys: ['Shift', 'T'], action: 'تغییر تم (روز/شب/سپیا/کنتراست بالا)' },
      { keys: ['+'], action: 'افزایش اندازه قلم' },
      { keys: ['-'], action: 'کاهش اندازه قلم' },
      { keys: ['L'], action: 'تغییر زبان EN ↔ FA' },
      { keys: ['Esc'], action: 'بستن پنل‌ها / خروج از تمرکز' },
    ],
  },
  {
    group: 'پنل‌ها',
    rows: [
      { keys: ['S'], action: 'تنظیمات' },
      { keys: ['C'], action: 'چپترها' },
      { keys: ['H'], action: 'نشان‌ها / هایلایت‌ها' },
      { keys: ['A'], action: 'گفتگو با هوش مصنوعی' },
      { keys: ['?'], action: 'این پنجره' },
    ],
  },
]

export function ShortcutsHelpOverlay({
  theme,
  onClose,
}: ShortcutsHelpOverlayProps) {
  const s = THEME_STYLES[theme]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="میان‌برهای صفحه‌کلید"
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: s.border }}
        >
          <h3 className="text-base font-bold">میان‌برهای صفحه‌کلید</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto scroll-warm px-5 py-4">
          <div className="space-y-5">
            {SHORTCUTS.map((section) => (
              <div key={section.group}>
                <h4
                  className="mb-2 text-xs font-bold uppercase tracking-wide opacity-60"
                  style={{ color: s.muted }}
                >
                  {section.group}
                </h4>
                <div className="space-y-1">
                  {section.rows.map((row) => (
                    <div
                      key={row.action}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <span className="text-sm">{row.action}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        {row.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="rounded-md border px-2 py-0.5 text-[11px] font-bold shadow-sm"
                            style={{
                              borderColor: s.border,
                              background: s.accent + '18',
                              color: s.text,
                            }}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="border-t px-5 py-3 text-center text-xs opacity-60"
          style={{ borderColor: s.border }}
        >
          برای بستن، Esc را بزنید یا بیرون پنجره کلیک کنید.
        </div>
      </motion.div>
    </div>
  )
}
