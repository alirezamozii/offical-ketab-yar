'use client';

/**
 * ReaderAudioControls — toolbar button that toggles TTS playback for the
 * current reader page or selected text.
 *
 * Renders three visual states:
 *   • Idle     → Volume2 icon, "گوش دادن" tooltip.
 *   • Loading  → Loader2 spinner (animated).
 *   • Playing  → Square icon + animated gold/amber AudioWaveBars.
 *
 * Intelligent Reading Position:
 *   1. If text is currently selected, plays ONLY the selected passage.
 *   2. If no text is selected, detects the exact paragraph currently visible
 *      at the reading line (scroll position) and starts playback from that
 *      point forward, without having to regenerate from the page start.
 *
 * Consumes the shared reader TTS context — must be rendered inside a
 * `<TTSProvider>`.
 */

import { Button } from '@/components/ui/button';
import { AudioWaveBars } from '@/components/reader/audio-wave-bars';
import { useReader } from '@/components/reader/reader-context';
import { useTTSContext } from '@/hooks/tts-provider';
import { getVisibleReadingText } from '@/lib/reader/scroll-text';
import { Loader2, Square, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReaderAudioControlsProps {
  /** Override the text to speak (defaults to visible scroll text). */
  text?: string;
  /** Override the language (defaults to the reader's current language). */
  lang?: 'en' | 'fa';
  /** Optional className for the button. */
  className?: string;
}

export function ReaderAudioControls({ text, lang, className }: ReaderAudioControlsProps) {
  const tts = useTTSContext();
  const {
    currentLanguage,
    currentParagraph,
    themeStyle,
    selectedText,
    selectedLocation,
    scrollRef,
    book,
  } = useReader();

  const handleClick = () => {
    if (tts.isPlaying || tts.isPaused) {
      tts.stop();
      return;
    }

    let textToSpeak = '';
    let langToSpeak: 'en' | 'fa' = lang ?? (currentLanguage === 'farsi' ? 'fa' : 'en');
    let contextToPass: { pageIndex?: number; pairId?: string } | undefined = undefined;

    // 1. If user selected a specific text, prioritize speaking that text
    if (text) {
      textToSpeak = text;
      contextToPass = selectedLocation ?? { pageIndex: currentParagraph };
    } else if (selectedText && selectedText.trim().length > 0) {
      textToSpeak = selectedText.trim();
      const isFa = /[\u0600-\u06FF]/.test(textToSpeak);
      langToSpeak = isFa ? 'fa' : 'en';
      contextToPass = selectedLocation ?? { pageIndex: currentParagraph };
    } else {
      // 2. Otherwise read from the exact paragraph/position currently visible in viewport
      textToSpeak = getVisibleReadingText(
        scrollRef.current,
        book,
        currentParagraph,
        currentLanguage,
      );
      contextToPass = { pageIndex: currentParagraph };
    }

    if (!textToSpeak) return;
    void tts.speak(textToSpeak, langToSpeak, undefined, contextToPass);
  };

  const isBusy = tts.isLoading || tts.isPlaying || tts.isPaused;
  const isSelected = Boolean(selectedText && selectedText.trim().length > 0);

  const label = tts.isLoading
    ? 'در حال آماده‌سازی صدا...'
    : tts.isPlaying
      ? 'توقف پخش'
      : tts.isPaused
        ? 'ادامه پخش'
        : isSelected
          ? 'شنیدن متن انتخاب‌شده'
          : 'گوش دادن از موقعیت فعلی';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={tts.isPlaying}
      className={cn('relative gap-1 px-2', className)}
      style={isBusy && themeStyle.accent ? { background: themeStyle.accent + '22' } : undefined}
    >
      {tts.isLoading ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-amber-500" />
      ) : tts.isPlaying ? (
        <span className="flex items-center gap-1.5">
          <Square
            aria-hidden="true"
            className="h-3 w-3 fill-current text-amber-600 dark:text-amber-400"
          />
          <AudioWaveBars active={tts.isPlaying} count={3} className="h-3.5" />
        </span>
      ) : (
        <Volume2 aria-hidden="true" className="h-4 w-4" />
      )}
      <span className="hidden text-xs font-medium sm:inline">
        {tts.isPlaying ? 'توقف' : isSelected ? 'شنیدن انتخاب' : 'گوش دادن'}
      </span>
    </Button>
  );
}
