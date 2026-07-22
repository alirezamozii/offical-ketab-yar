'use client'

import { Button } from '@/components/ui/button'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Keyboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReaderTheme } from '@/lib/reader/types'
import { THEME_STYLES } from '@/lib/reader/types'

interface ShortcutsHintTooltipProps {
  theme: ReaderTheme
}

const STORAGE_KEY = STORAGE_KEYS.readerShortcutsHintSeen
/** Auto-hide after this many milliseconds (≈12s — long enough to read). */
const AUTO_HIDE_MS = 12_000

/**
 * A small one-time tooltip that appears the first time a reader opens the
 * reader, hinting that keyboard shortcuts are available. Dismissed either
 * by clicking the button (which opens the full help overlay), by clicking
 * the X, or automatically after AUTO_HIDE_MS. Once shown, the dismissal
 * is persisted to `STORAGE_KEYS.readerShortcutsHintSeen` so it won't pop
 * up again.
 *
 * The tooltip is intentionally minimal — the full overlay (with all
 * shortcuts grouped by category) is one `?` keypress away.
 */
export function ShortcutsHintTooltip({ theme }: ShortcutsHintTooltipProps) {
  const s = THEME_STYLES[theme]
  const [visible, setVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      /* ignore */
    }
    if (seen) return
    // Defer slightly so it appears after the reader chrome slides in.
    const showId = window.setTimeout(() => setVisible(true), 900)
    return () => window.clearTimeout(showId)
  }, [])

  useEffect(() => {
    if (!visible) return
    const hideId = window.setTimeout(() => {
      setVisible(false)
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
    }, AUTO_HIDE_MS)
    return () => window.clearTimeout(hideId)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const openHelp = () => {
    // Dispatch a synthetic keydown so the existing ? handler in the
    // keyboard-shortcuts hook opens the help overlay.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    dismiss()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="pointer-events-auto absolute bottom-24 end-3 z-[150] w-[260px] rounded-xl border-2 p-3 shadow-2xl backdrop-blur-md sm:end-5"
          style={{
            background: s.bg + 'f2',
            borderColor: s.accent,
            color: s.text,
          }}
          role="dialog"
          aria-label="میان‌برهای صفحه‌کلید"
        >
          <div className="flex items-start gap-2.5">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: s.accent + '22', color: s.accent }}
            >
              <Keyboard className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-snug">
                میان‌برهای صفحه‌کلید فعال است
              </p>
              <p className="mt-1 text-[11px] leading-relaxed opacity-70">
                برای دیدن همهٔ کلیدها، <kbd className="font-bold">؟</kbd> را
                بزنید. جابه‌جایی با <kbd className="font-bold">←/→</kbd>،
                تمرکز با <kbd className="font-bold">F</kbd>.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={dismiss}
              aria-label="بستن"
            >
              <span className="text-base leading-none" aria-hidden>
                ×
              </span>
            </Button>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              onClick={openHelp}
              className="h-7 px-3 text-[11px]"
              style={{ background: s.accent, color: '#fff' }}
            >
              مشاهده همه
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
