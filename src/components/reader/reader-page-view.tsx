'use client'

import { cn } from '@/lib/utils'
import type { BilingualItem, ReadingPreferences } from '@/lib/reader/types'
import { useTTSContext } from '@/hooks/tts-provider'
import { memo } from 'react'

interface ParagraphBlockProps {
  item: BilingualItem
  prefs: ReadingPreferences
  accent: string
  onMouseUp?: (e: React.MouseEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
}

/**
 * Renders a single bilingual paragraph (heading or body text) with an optional
 * Farsi/English subtitle that animates in when `prefs.showSubtitles` is on.
 *
 * Real Word Sync: When TTS is reading this paragraph, the exact word actively
 * being spoken is highlighted in real-time with an accent glow and underline.
 */
export const ParagraphBlock = memo(function ParagraphBlock({
  item,
  prefs,
  accent,
  onMouseUp,
  onTouchEnd,
}: ParagraphBlockProps) {
  const primaryLang = prefs.language
  const secondaryLang = primaryLang === 'english' ? 'farsi' : 'english'
  const primary = primaryLang === 'english' ? item.english : item.farsi
  const secondary = secondaryLang === 'english' ? item.english : item.farsi
  const isHeading = item.type === 'heading'
  const primaryDir = primaryLang === 'english' ? 'ltr' : 'rtl'
  const secondaryDir = secondaryLang === 'english' ? 'ltr' : 'rtl'

  const tts = useTTSContext()

  // Check if TTS is currently reading this paragraph
  const isSpeakingThis = Boolean(
    (tts.isPlaying || tts.isPaused) &&
    tts.currentText &&
    (tts.currentText.includes(primary) || primary.includes(tts.currentText) || tts.currentText.trim() === primary.trim())
  )

  // Render text with word-by-word active highlighting when speaking
  const renderTextContent = (text: string) => {
    if (!isSpeakingThis || tts.activeWordIndex < 0) {
      return text
    }

    let wordIdx = -1
    const tokens = text.split(/(\s+)/)

    return tokens.map((token, idx) => {
      if (/^\s+$/.test(token)) {
        return token
      }
      wordIdx++
      const isActive = wordIdx === tts.activeWordIndex

      return (
        <span
          key={idx}
          className={cn(
            'inline-block transition-colors duration-100 rounded px-0.5',
            isActive && 'font-bold shadow-sm',
          )}
          style={
            isActive
              ? {
                  background: accent + '33',
                  color: accent,
                  boxShadow: `0 0 0 2px ${accent}44`,
                }
              : undefined
          }
        >
          {token}
        </span>
      )
    })
  }

  return (
    <div
      className="mb-7 max-w-none"
      style={{
        fontSize: `${prefs.fontSize}px`,
        lineHeight: prefs.lineHeight,
        letterSpacing: `${prefs.letterSpacing}em`,
        color: 'inherit',
      }}
      dir={primaryLang === 'farsi' ? 'rtl' : 'ltr'}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    >
      {isHeading ? (
        <h2
          className="mb-4 font-bold tracking-tight"
          style={{
            fontSize: `${prefs.fontSize + 6}px`,
            lineHeight: 1.3,
            color: accent,
          }}
          dir={primaryDir}
        >
          {renderTextContent(primary)}
        </h2>
      ) : (
        <p
          className="mb-0"
          dir={primaryDir}
          style={{
            textAlign: primaryDir === 'rtl' ? 'right' : 'justify',
            lineHeight: prefs.lineHeight,
            color: 'inherit',
          }}
        >
          {renderTextContent(primary)}
        </p>
      )}

      {prefs.showSubtitles && secondary && (
        <div
          className={cn('mt-2 text-[0.86em] transition-opacity duration-200')}
          dir={secondaryDir}
          style={{
            borderInlineStart: `3px solid ${accent}`,
            paddingInlineStart: '0.85rem',
            lineHeight: prefs.lineHeight,
            color: 'inherit',
            opacity: 0.78,
          }}
        >
          {secondary}
        </div>
      )}
    </div>
  )
})

