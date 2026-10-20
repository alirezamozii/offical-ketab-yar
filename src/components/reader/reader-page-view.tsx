'use client'

import { cn } from '@/lib/utils'
import type { BilingualItem, ReadingPreferences } from '@/lib/reader/types'
import { useTTSContext } from '@/hooks/tts-provider'
import {
  alignBilingualSentences,
  type MatchedSentencePair,
} from '@/lib/reader/sentence-aligner'
import { Fragment, memo, useMemo, useState } from 'react'

interface ParagraphBlockProps {
  item: BilingualItem
  prefs: ReadingPreferences
  accent: string
  onMouseUp?: (e: React.MouseEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
}

interface ParagraphGroup {
  pIdx: number
  pairs: MatchedSentencePair[]
}

/**
 * Renders a single bilingual paragraph (heading or body text) with smart
 * sentence-by-sentence matching ("مچ شدن جملات در هر نقطه").
 *
 * Each sentence is wrapped in a span carrying its matched pair id. Hovering a
 * sentence highlights it AND its counterpart in the other language, in both
 * directions (EN→FA and FA→EN), via shared hover state within the block.
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
  const primary = (primaryLang === 'english' ? item.english : item.farsi) || ''
  const secondary = (secondaryLang === 'english' ? item.english : item.farsi) || ''
  const isHeading = item.type === 'heading'
  const primaryDir = primaryLang === 'english' ? 'ltr' : 'rtl'
  const secondaryDir = secondaryLang === 'english' ? 'ltr' : 'rtl'

  const tts = useTTSContext()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Check if TTS is currently reading this paragraph
  const isSpeakingThis = Boolean(
    (tts.isPlaying || tts.isPaused) &&
      tts.currentText &&
      (tts.currentText.includes(primary) ||
        primary.includes(tts.currentText) ||
        tts.currentText.trim() === primary.trim()),
  )

  const sentencePairs = useMemo<MatchedSentencePair[]>(() => {
    if (isHeading) {
      return [{ id: 'heading-0', primary, secondary, paragraphIndex: 0 }]
    }
    if (!primary.trim() && !secondary.trim()) return []
    const aligned = alignBilingualSentences(primary, secondary, primaryLang)
    return aligned.length > 0 ? aligned : [{ id: 'pair-0', primary, secondary }]
  }, [primary, secondary, isHeading, primaryLang])

  // Group aligned sentence pairs back into visual paragraphs so the layout
  // stays identical to the old paragraph-based rendering.
  const paragraphGroups = useMemo<ParagraphGroup[]>(() => {
    const groups: ParagraphGroup[] = []
    for (const pair of sentencePairs) {
      const pIdx = pair.paragraphIndex ?? 0
      const last = groups[groups.length - 1]
      if (last && last.pIdx === pIdx) {
        last.pairs.push(pair)
      } else {
        groups.push({ pIdx, pairs: [pair] })
      }
    }
    return groups
  }, [sentencePairs])

  // Cumulative primary-word offset per pair, so TTS word indices stay in sync
  const wordOffsets = useMemo(() => {
    const map = new Map<string, number>()
    let running = 0
    for (const pair of sentencePairs) {
      map.set(
        pair.id,
        running,
      )
      running += pair.primary.split(/\s+/).filter(Boolean).length
    }
    return map
  }, [sentencePairs])

  // Render a matched sentence as a hoverable span, with word-by-word active
  // highlighting when TTS is speaking this block.
  const renderSentence = (
    text: string,
    pairId: string,
    startWordOffset: number,
  ) => {
    const isHovered = hoveredId === pairId

    let content: React.ReactNode = text
    if (isSpeakingThis && tts.activeWordIndex >= 0) {
      let wordIdx = startWordOffset - 1
      const tokens = text.split(/(\s+)/)
      content = tokens.map((token, idx) => {
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
      <span
        data-pair-id={pairId}
        onMouseEnter={() => setHoveredId(pairId)}
        onMouseLeave={() => setHoveredId((h) => (h === pairId ? null : h))}
        className="rounded transition-colors duration-150"
        style={
          isHovered
            ? {
                background: `${accent}26`,
                boxShadow: `0 0 0 2px ${accent}1f`,
              }
            : undefined
        }
      >
        {content}
      </span>
    )
  }

  const renderPairSequence = (
    pairs: MatchedSentencePair[],
    side: 'primary' | 'secondary',
  ) => {
    let hasRendered = false
    return pairs.map((pair, i) => {
      const text = side === 'primary' ? pair.primary : pair.secondary
      if (!text) return null
      const separator = hasRendered ? ' ' : null
      hasRendered = true
      return (
        <Fragment key={pair.id}>
          {separator}
          {renderSentence(text, pair.id, wordOffsets.get(pair.id) ?? 0)}
        </Fragment>
      )
    })
  }

  return (
    <div
      className="mb-8 max-w-none"
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
        <div>
          <h2
            className="mb-3 font-bold tracking-tight"
            style={{
              fontSize: `${prefs.fontSize + 6}px`,
              lineHeight: 1.3,
              color: accent,
            }}
            dir={primaryDir}
          >
            {renderSentence(primary, 'heading-0', 0)}
          </h2>
          {prefs.showSubtitles && secondary && (
            <div
              className={cn(
                'mb-4 text-[0.88em] opacity-80 transition-opacity duration-200',
                'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1',
              )}
              dir={secondaryDir}
              style={{
                borderInlineStart: `3px solid ${accent}`,
                paddingInlineStart: '0.85rem',
                lineHeight: prefs.lineHeight,
                color: 'inherit',
              }}
            >
              {renderSentence(secondary, 'heading-0', 0)}
            </div>
          )}
        </div>
      ) : (
        // Render each paragraph as matched sentence spans; hovering any
        // sentence lights up its counterpart in the other language.
        <div className="space-y-6">
          {paragraphGroups.map((group) => {
            const hasSecondary = group.pairs.some((p) => p.secondary)
            return (
              <div
                key={group.pIdx}
                className="bilingual-para-block transition-all duration-150"
              >
                {/* Primary Paragraph */}
                <p
                  className="mb-0 text-inherit transition-colors"
                  dir={primaryDir}
                  style={{
                    textAlign: primaryDir === 'rtl' ? 'right' : 'justify',
                    lineHeight: prefs.lineHeight,
                  }}
                >
                  {renderPairSequence(group.pairs, 'primary')}
                </p>

                {/* Matching Secondary (Subtitle) Paragraph */}
                {prefs.showSubtitles && hasSecondary && (
                  <div
                    className={cn(
                      'mt-2.5 text-[0.88em] transition-all duration-200',
                      'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1',
                    )}
                    dir={secondaryDir}
                    style={{
                      borderInlineStart: `3px solid ${accent}`,
                      paddingInlineStart: '0.85rem',
                      lineHeight: prefs.lineHeight,
                      color: 'inherit',
                      opacity: 0.8,
                    }}
                  >
                    {renderPairSequence(group.pairs, 'secondary')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
