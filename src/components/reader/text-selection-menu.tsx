'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BookOpen, BookmarkPlus, Copy, MessageSquare, Share2, X } from 'lucide-react'
import {
  HIGHLIGHT_LABELS,
  HIGHLIGHT_SWATCHES,
  type Highlight,
  type ReaderTheme,
} from '@/lib/reader/types'

interface TextSelectionMenuProps {
  position: { x: number; y: number }
  theme: ReaderTheme
  selectedText: string
  onHighlight: (color: Highlight['color']) => void
  onShowDictionary?: () => void
  onAddToVocabulary?: () => void
  onCopy?: () => void
  onShare?: () => void
  onAIChat: () => void
  onClose: () => void
}

const SWATCH_COLORS: Highlight['color'][] = [
  'yellow',
  'orange',
  'gold',
  'green',
  'pink',
  'blue',
]

export function TextSelectionMenu({
  position,
  theme,
  selectedText,
  onHighlight,
  onShowDictionary,
  onAddToVocabulary,
  onCopy,
  onShare,
  onAIChat,
  onClose,
}: TextSelectionMenuProps) {
  const isSingleWord = selectedText.trim().split(/\s+/).length === 1
  const dark = theme === 'dark' || theme === 'high-contrast'

  // Clamp horizontal position so the menu never overflows the viewport.
  // The menu is responsive (~340px desktop, ~280px mobile), so we use a
  // conservative half-width and let CSS transform handle the rest.
  // On very small screens (<360px) the menu is allowed to use the full
  // width minus 16px margins.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 9999
  const MENU_HALF = vw < 400 ? 150 : 180
  const safeX = Math.max(
    MENU_HALF + 8,
    Math.min(vw - MENU_HALF - 8, position.x),
  )
  // Clamp vertical position so the menu (≈56px tall) doesn't push off-screen
  // below the viewport. If the selection is in the bottom 80px, flip above.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 9999
  const safeY = position.y + 60 > vh ? Math.max(8, position.y - 60) : position.y

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'no-select fixed z-[120] flex max-w-[calc(100vw-16px)] flex-wrap justify-center gap-1 rounded-xl border-2 p-1.5 shadow-2xl backdrop-blur-xl sm:flex-nowrap sm:gap-1.5 sm:p-2',
        dark
          ? theme === 'high-contrast'
            ? 'border-white bg-black/95'
            : 'border-gold-600 bg-[#1a1612]/95'
          : 'border-gold-400 bg-gold-50/95',
      )}
      style={{
        left: `${safeX}px`,
        top: `${safeY}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      {SWATCH_COLORS.map((color) => {
        const sw = HIGHLIGHT_SWATCHES[color]
        return (
          <motion.div
            key={color}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="p-1.5 sm:p-2"
              onClick={() => onHighlight(color)}
              aria-label={`هایلایت ${HIGHLIGHT_LABELS[color]}`}
            >
              <span
                className="block h-6 w-6 rounded-lg border-2 shadow sm:h-8 sm:w-8"
                style={{ background: sw.bg, borderColor: sw.border }}
              />
            </Button>
          </motion.div>
        )
      })}

      <div className={cn('mx-1 my-1 w-px', dark ? 'bg-gold-700' : 'bg-gold-300')} />

      {isSingleWord && onShowDictionary && (
        <IconButton theme={theme} onClick={onShowDictionary} label="دیکشنری">
          <BookOpen
            className={cn('h-5 w-5', dark ? 'text-gold-400' : 'text-gold-600')}
          />
        </IconButton>
      )}
      {isSingleWord && onAddToVocabulary && (
        <IconButton
          theme={theme}
          onClick={onAddToVocabulary}
          label="افزودن به واژگان"
        >
          <BookmarkPlus
            className={cn('h-5 w-5', dark ? 'text-gold-400' : 'text-gold-600')}
          />
        </IconButton>
      )}
      {onCopy && (
        <IconButton theme={theme} onClick={onCopy} label="کپی">
          <Copy
            className={cn('h-5 w-5', dark ? 'text-emerald-400' : 'text-emerald-600')}
          />
        </IconButton>
      )}
      {onShare && (
        <IconButton theme={theme} onClick={onShare} label="اشتراک‌گذاری">
          <Share2
            className={cn('h-5 w-5', dark ? 'text-gold-400' : 'text-gold-600')}
          />
        </IconButton>
      )}

      <IconButton theme={theme} onClick={onAIChat} label="پرسش از AI">
        <MessageSquare className="h-5 w-5 text-gold-600" />
        <motion.span
          className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-500"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </IconButton>

      <div className={cn('mx-1 my-1 w-px', dark ? 'bg-gold-700' : 'bg-gold-300')} />

      <IconButton theme={theme} onClick={onClose} label="بستن">
        <X className={cn('h-5 w-5', dark ? 'text-gold-400' : 'text-gold-600')} />
      </IconButton>
    </motion.div>
  )
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  theme: ReaderTheme
}) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClick}
        className="relative p-1.5 sm:p-2"
        title={label}
        aria-label={label}
      >
        {children}
      </Button>
    </motion.div>
  )
}
