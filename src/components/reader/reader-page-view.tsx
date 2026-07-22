'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { BilingualItem, ReadingPreferences } from '@/lib/reader/types'
import { memo } from 'react'

interface ParagraphBlockProps {
  item: BilingualItem
  prefs: ReadingPreferences
  accent: string
  /** Whether this is the first child of the paragraph (drop-cap applies). */
  isFirstChild?: boolean
  onMouseUp?: (e: React.MouseEvent) => void
}

/**
 * Renders a single bilingual paragraph (heading or body text) with an optional
 * Farsi/English subtitle that animates in when `prefs.showSubtitles` is on.
 * Used in the continuous-reading column — one ParagraphBlock per paragraph.
 *
 * Honors:
 *  • `prefs.fontSize`, `prefs.lineHeight`, `prefs.letterSpacing`
 *  • `prefs.dropCaps` — turns the first letter of the first body paragraph
 *    into a large floated drop cap (only when the primary language is the
 *    Latin script; for Persian we use ::first-letter which works on the
 *    element directly).
 */
export const ParagraphBlock = memo(function ParagraphBlock({
  item,
  prefs,
  accent,
  isFirstChild = false,
  onMouseUp,
}: ParagraphBlockProps) {
  const primaryLang = prefs.language
  const secondaryLang = primaryLang === 'english' ? 'farsi' : 'english'
  const primary = primaryLang === 'english' ? item.english : item.farsi
  const secondary = secondaryLang === 'english' ? item.english : item.farsi
  const isHeading = item.type === 'heading'
  const primaryDir = primaryLang === 'english' ? 'ltr' : 'rtl'
  const secondaryDir = secondaryLang === 'english' ? 'ltr' : 'rtl'
  const applyDropCap = prefs.dropCaps && isFirstChild && !isHeading

  return (
    <div
      className="prose prose-lg mb-7 max-w-none"
      style={{
        fontSize: `${prefs.fontSize}px`,
        lineHeight: prefs.lineHeight,
        letterSpacing: `${prefs.letterSpacing}em`,
        color: 'inherit',
      }}
      dir={primaryLang === 'farsi' ? 'rtl' : 'ltr'}
      onMouseUp={onMouseUp}
    >
      {isHeading ? (
        <h2
          className="mb-4 font-bold leading-tight"
          style={{ fontSize: `${prefs.fontSize + 6}px` }}
          dir={primaryDir}
        >
          {primary}
        </h2>
      ) : (
        <p
          className={cn('mb-0 leading-relaxed', applyDropCap && 'reader-drop-cap')}
          dir={primaryDir}
          style={{ textAlign: primaryDir === 'rtl' ? 'right' : 'justify' }}
        >
          {primary}
        </p>
      )}

      <AnimatePresence initial={false}>
        {prefs.showSubtitles && secondary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 0.78, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('mt-2 text-[0.86em] leading-relaxed')}
            dir={secondaryDir}
            style={{
              borderInlineStart: `3px solid ${accent}`,
              paddingInlineStart: '0.85rem',
              color: 'inherit',
              opacity: 0.72,
            }}
          >
            {secondary}
          </motion.div>
        )}
      </AnimatePresence>

      {applyDropCap && <DropCapStyle accent={accent} dir={primaryDir} />}
    </div>
  )
}, (prev, next) => {
  return (
    prev.item.english === next.item.english &&
    prev.item.farsi === next.item.farsi &&
    prev.item.type === next.item.type &&
    prev.accent === next.accent &&
    prev.isFirstChild === next.isFirstChild &&
    prev.prefs.fontSize === next.prefs.fontSize &&
    prev.prefs.lineHeight === next.prefs.lineHeight &&
    prev.prefs.letterSpacing === next.prefs.letterSpacing &&
    prev.prefs.theme === next.prefs.theme &&
    prev.prefs.showSubtitles === next.prefs.showSubtitles &&
    prev.prefs.dropCaps === next.prefs.dropCaps &&
    prev.prefs.language === next.prefs.language
  )
})

/**
 * Inline <style> scoping the drop-cap effect to `.reader-drop-cap::first-letter`
 * for this paragraph block. Kept inline (rather than in globals.css) so the
 * rule ships only when drop caps are actually enabled, and so the accent
 * color adapts to the active theme.
 */
function DropCapStyle({
  accent,
  dir,
}: {
  accent: string
  dir: 'rtl' | 'ltr'
}) {
  // Persian script doesn't render a drop cap the way Latin does (the bidi
  // isolation of ::first-letter is fragile). We still try, but adjust the
  // float side based on direction so the layout looks balanced.
  const floatSide = dir === 'rtl' ? 'right' : 'left'
  return (
    <style>{`
      .reader-drop-cap::first-letter {
        float: ${floatSide};
        font-size: 3.2em;
        line-height: 0.78;
        font-weight: 700;
        margin-inline-end: 0.12em;
        margin-block-start: 0.06em;
        color: ${accent};
      }
    `}</style>
  )
}
