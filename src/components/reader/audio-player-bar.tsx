'use client';

/**
 * AudioPlayerBar — floating bottom bar that shows when audio is playing
 * (or paused while reading) in the professional reader.
 *
 * Layout: [play/pause] [stop] [progress bar with time X:XX / Y:YY]
 *         [truncated "now reading" text] [wave bars indicator].
 *
 * Auto-hides when `currentText` is empty (i.e. no playback). Animated
 * slide-in via framer-motion. Honours `useReducedMotion`.
 *
 * Consumes the shared reader TTS context — must be rendered inside a
 * `<TTSProvider>`. The provider is wired at the `ProfessionalReader`
 * level so the toolbar button and this bar share a single playback
 * instance.
 */

import { Button } from '@/components/ui/button';
import { AudioWaveBars } from '@/components/reader/audio-wave-bars';
import { useTTSContext } from '@/hooks/tts-provider';
import { useReader } from '@/components/reader/reader-context';
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store';
import { toPersianDigits } from '@/lib/reader/types';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${toPersianDigits(m)}:${toPersianDigits(s).padStart(2, '۰')}`;
}

export function AudioPlayerBar() {
  const tts = useTTSContext();
  const { themeStyle, currentLanguage } = useReader();
  const audioSpeed = useReaderSettingsStore((state) => state.audioSpeed);
  const setAudioSpeed = useReaderSettingsStore((state) => state.setAudioSpeed);
  const voiceId = useReaderSettingsStore((state) => state.voiceId);
  const setVoiceId = useReaderSettingsStore((state) => state.setVoiceId);

  const isMale = voiceId.includes('Andrew') || voiceId.includes('Farid');

  const toggleVoiceGender = () => {
    if (currentLanguage === 'english') {
      setVoiceId(isMale ? 'en-US-AvaMultilingualNeural' : 'en-US-AndrewMultilingualNeural');
    } else {
      setVoiceId(isMale ? 'fa-IR-DilaraNeural' : 'fa-IR-FaridNeural');
    }
  };

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.findIndex((s) => Math.abs(s - audioSpeed) < 0.05);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setAudioSpeed(SPEEDS[nextIndex]);
  };

  const visible = Boolean(tts.currentText || tts.isPlaying || tts.isPaused || tts.isLoading);

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-20 z-30 mx-auto flex w-[min(640px,calc(100%-1.5rem))] items-center gap-2 rounded-2xl border p-2 shadow-lg backdrop-blur-md sm:gap-3 sm:p-3',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-8 opacity-0 pointer-events-none',
      )}
      style={{
        borderColor: themeStyle.accent + '44',
        background: themeStyle.bg + 'f2',
      }}
      role="region"
      aria-label="پخش صدا"
      aria-hidden={!visible}
    >
      {/* Play / Pause */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full"
        style={{
          background: themeStyle.accent + '22',
          color: themeStyle.accent,
        }}
        onClick={() => (tts.isPlaying ? tts.pause() : tts.resume())}
        aria-label={tts.isPlaying ? 'توقف موقت پخش' : 'ادامه پخش'}
        disabled={tts.isLoading || (!tts.isPlaying && !tts.isPaused)}
      >
        {tts.isLoading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : tts.isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Stop */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full"
        onClick={tts.stop}
        aria-label="توقف پخش"
      >
        <Square className="h-4 w-4" />
      </Button>

      {/* Speed Toggle (0.25x -> 0.5x -> 1x -> 1.25x -> 1.5x -> 2x) */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="flex h-9 shrink-0 items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums transition-[transform,opacity,colors,border-color,background-color] active:scale-95 hover:opacity-90"
        style={{
          borderColor: themeStyle.accent + '44',
          background: themeStyle.accent + '18',
          color: themeStyle.accent,
        }}
        title="تغییر سرعت پخش (۰٫۲۵x، ۰٫۵x، ۱x، ۱٫۲۵x، ۱٫۵x، ۲x)"
        aria-label={`تغییر سرعت پخش، سرعت فعلی ${audioSpeed} برابر`}
      >
        {audioSpeed}×
      </button>

      {/* Voice Gender Toggle (Female / Male) */}
      <button
        type="button"
        onClick={toggleVoiceGender}
        className="flex h-9 shrink-0 items-center justify-center rounded-xl border px-2 text-xs font-bold transition-[transform,opacity,colors,border-color,background-color] active:scale-95 hover:opacity-90"
        style={{
          borderColor: themeStyle.accent + '44',
          background: themeStyle.accent + '18',
          color: themeStyle.accent,
        }}
        title={
          isMale
            ? 'صدای راوی: مرد (کلیک برای تغییر به صدای زن)'
            : 'صدای راوی: زن (کلیک برای تغییر به صدای مرد)'
        }
        aria-label={`تغییر صدای راوی، صدای فعلی ${isMale ? 'مرد' : 'زن'}`}
      >
        {isMale ? 'مرد' : 'زن'}
      </button>

      {/* Progress + time */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: themeStyle.border }}
          role="progressbar"
          aria-label="پیشرفت پخش"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((tts.progress || 0) * 100)}
        >
          <div
            className="absolute inset-y-0 right-0 will-change-transform"
            style={{
              width: `${Math.max(0, Math.min(100, (tts.progress || 0) * 100))}%`,
              background: themeStyle.accent,
              transition: 'width 120ms linear',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold tabular-nums">
          <span style={{ color: themeStyle.muted }}>
            {formatTime(tts.elapsedSec)} / {formatTime(tts.durationSec)}
          </span>
          <span className="flex items-center gap-1">
            {tts.isPlaying && <AudioWaveBars count={3} className="h-3" />}
            <Volume2 className="h-3 w-3" style={{ color: themeStyle.accent }} />
          </span>
        </div>
      </div>

      {/* Now-reading text (truncated) */}
      {tts.currentText && (
        <p
          className="hidden max-w-[40%] truncate text-xs italic sm:block"
          style={{ color: themeStyle.muted }}
          dir="auto"
          title={tts.currentText}
        >
          «{tts.currentText}»
        </p>
      )}
    </div>
  );
}
