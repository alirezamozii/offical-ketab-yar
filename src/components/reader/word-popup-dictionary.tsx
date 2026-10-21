'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
} from '@/components/ui/drawer';
import { AudioWaveBars } from '@/components/reader/audio-wave-bars';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { DictionaryResult, PersianMeaningGroup } from '@/lib/ai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  BookmarkPlus,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  History,
  Network,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ReaderTheme } from '@/lib/reader/types';
import { THEME_STYLES } from '@/lib/reader/types';

interface WordPopupDictionaryProps {
  word: string;
  context?: string;
  theme: ReaderTheme;
  bookSlug?: string;
  /** Controlled open state — when false the dialog is hidden. */
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

// ── Persian part-of-speech labels ──────────────────────────────────────────
const POS_FA: Record<string, string> = {
  noun: 'اسم',
  nounphrase: 'عبارت اسمی',
  verb: 'فعل',
  adjective: 'صفت',
  adj: 'صفت',
  adverb: 'قید',
  adv: 'قید',
  pronoun: 'ضمیر',
  preposition: 'حرف اضافه',
  prep: 'حرف اضافه',
  postposition: 'حرف پسوندی',
  conjunction: 'حرف ربط',
  conj: 'حرف ربط',
  interjection: 'حرف ندا',
  exclamation: 'عاطفه',
  numeral: 'عدد',
  number: 'عدد',
  determiner: 'حرف تعریف',
  article: 'حرف تعریف',
  abbreviation: 'مخفف',
  particle: 'ذره',
};

function posFa(pos: string): string {
  return POS_FA[(pos || '').toLowerCase().trim()] || pos;
}

const LEVEL_SHORT: Record<string, string> = {
  A1: 'A1 · مقدماتی',
  A2: 'A2 · پایه‌ای',
  B1: 'B1 · متوسط',
  B2: 'B2 · فوق متوسط',
  C1: 'C1 · پیشرفته',
  C2: 'C2 · تخصصی',
};

const FREQ_LABEL: Record<string, string> = {
  common: 'پرکاربرد',
  uncommon: 'متوسط‌کاربرد',
  rare: 'کم‌کاربرد',
};

function levelColor(level: string): string {
  if (level === 'A1' || level === 'A2') return '#4d7c5a'; // muted green
  if (level === 'B1' || level === 'B2') return '#b8884a'; // amber-gold
  return '#a8523c'; // warm terracotta
}

function freqColor(band: string): string {
  if (band === 'common') return '#4d7c5a';
  if (band === 'uncommon') return '#b8884a';
  return '#a8523c';
}

// ── Client-side dictionary cache (localStorage, stale-while-revalidate) ────
type DictPayload = DictionaryResult & {
  persian?: string;
  pos?: string;
  audioUrl?: string | null;
  source?: string;
};

const CACHE_KEY = 'bz-dict-cache-v1';
const CACHE_MAX = 400;
const FRESH_MS = 1000 * 60 * 60 * 24; // 1 day — older entries refresh in background

interface CacheRecord {
  at: number;
  payload: DictPayload;
}

function readCache(): Record<string, CacheRecord> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function cacheGet(word: string): CacheRecord | null {
  return readCache()[word.toLowerCase().trim()] || null;
}

function cacheSet(word: string, payload: DictPayload) {
  try {
    const cache = readCache();
    cache[word.toLowerCase().trim()] = { at: Date.now(), payload };
    const keys = Object.keys(cache);
    if (keys.length > CACHE_MAX) {
      keys.sort((a, b) => cache[a].at - cache[b].at);
      for (const k of keys.slice(0, keys.length - CACHE_MAX)) delete cache[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full / private mode — cache is best-effort
  }
}

// ── State hook: cached-first lookup with background refresh ────────────────
export function useWordPopupState(
  wordProp: string,
  context?: string,
  bookSlug?: string,
  onSaved?: () => void,
) {
  const [word, setWord] = useState(wordProp);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DictPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  /** Words visited through chip navigation — enables the back button. */
  const [history, setHistory] = useState<string[]>([]);
  /** Incremented by `retry` to re-run the lookup effect. */
  const [retryNonce, setRetryNonce] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    setWord(wordProp);
    setHistory([]);
  }, [wordProp]);

  useEffect(() => {
    const clean = word.trim();
    if (!clean) {
      setLoading(false);
      setResult(null);
      return;
    }
    let active = true;
    const id = ++requestId.current;

    // Instant paint from the client cache…
    const cached = cacheGet(clean);
    if (cached) {
      setResult(cached.payload);
      setError(null);
      setLoading(false);
    } else {
      setResult(null);
      setLoading(true);
      setError(null);
    }

    // …then refresh in the background (skipped while the entry is fresh).
    if (!cached || Date.now() - cached.at > FRESH_MS) {
      if (!cached) setLoading(true);
      fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ word: clean, context }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || data.error) {
            throw new Error(data.error || 'اطلاعات واژه یافت نشد.');
          }
          return data as DictPayload;
        })
        .then((data) => {
          if (!active || id !== requestId.current) return;
          cacheSet(clean, data);
          setResult(data);
        })
        .catch((err) => {
          if (active && id === requestId.current && !cached) {
            setError(err.message || 'خطا در دریافت اطلاعات دیکشنری.');
          }
        })
        .finally(() => {
          if (active && id === requestId.current) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [word, context, retryNonce]);

  const speak = useCallback(() => {
    const clean = word.trim();
    if (!clean) return;
    setIsPlayingAudio(true);

    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fallbackSpeak = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      try {
        window.speechSynthesis?.cancel();
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'en-US';
        u.onend = () => setIsPlayingAudio(false);
        u.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis?.speak(u);
      } catch {
        setIsPlayingAudio(false);
      }
    };

    const targetAudioUrl = result?.audioUrl || `/api/tts?text=${encodeURIComponent(clean)}&lang=en`;
    try {
      const audio = new Audio(targetAudioUrl);

      // 4s watchdog: Never let word pronunciation hang indefinitely
      timer = setTimeout(() => {
        if (!finished) {
          try {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
          } catch {}
          fallbackSpeak();
        }
      }, 4000);

      audio.onplay = () => {
        finished = true;
        if (timer) clearTimeout(timer);
      };
      audio.onended = () => {
        finished = true;
        if (timer) clearTimeout(timer);
        setIsPlayingAudio(false);
      };
      audio.onerror = () => fallbackSpeak();
      audio.play().catch(() => fallbackSpeak());
    } catch {
      fallbackSpeak();
    }
  }, [word, result?.audioUrl]);

  const addToVocab = useCallback(() => {
    if (!result) return;
    const translation = result.translation || result.persian || '';
    fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        word: result.word || word,
        definition: result.definition || '',
        translation,
        context,
        bookSlug,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        toast.success(
          translation
            ? `«${result.word || word}» با معنی «${translation}» به لیست واژه‌های تو اضافه شد ✓`
            : `«${result.word || word}» به لیست واژه‌های تو اضافه شد ✓`,
        );
        onSaved?.();
      })
      .catch(() => toast.error('خطا در ذخیره واژه'));
  }, [result, word, context, bookSlug, onSaved]);

  const navigateToWord = useCallback(
    (w: string) => {
      const clean = w.trim();
      if (!clean || clean.toLowerCase() === word.toLowerCase()) return;
      setHistory((h) => [...h, word]);
      setWord(clean);
    },
    [word],
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setWord(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setRetryNonce((n) => n + 1);
  }, []);

  return {
    word,
    loading,
    result,
    error,
    isPlayingAudio,
    speak,
    addToVocab,
    navigateToWord,
    goBack,
    canGoBack: history.length > 0,
    retry,
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export function WordPopupDictionary({
  word: wordProp,
  context,
  theme,
  bookSlug,
  open,
  onClose,
  onSaved,
}: WordPopupDictionaryProps) {
  const isMobile = useIsMobile();
  const state = useWordPopupState(wordProp, context, bookSlug, onSaved);
  const s = THEME_STYLES[theme] || THEME_STYLES.light;

  const body = <DictionaryBody {...state} onClose={onClose} theme={theme} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DrawerContent
          className="rounded-t-3xl border-t-2 p-0 overflow-hidden shadow-2xl max-h-[92dvh]"
          style={{ background: s.bg, color: s.text, borderColor: s.border }}
        >
          <DrawerHandle className="opacity-40" style={{ background: s.accent }} />
          <DrawerTitle className="sr-only">
            دیکشنری {state.word ? `— ${state.word}` : ''}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            ترجمه فارسی، معانی چندگانه، تعریف انگلیسی، مترادف، متضاد و تلفظ صوتی
          </DrawerDescription>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-2 p-0 shadow-2xl sm:max-w-lg"
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <DialogTitle className="sr-only">دیکشنری {state.word ? `— ${state.word}` : ''}</DialogTitle>
        <DialogDescription className="sr-only">
          ترجمه فارسی، معانی چندگانه، تعریف انگلیسی، مترادف، متضاد و تلفظ صوتی
        </DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}

// ── Shared body (mobile drawer / desktop dialog) ───────────────────────────
function DictionaryBody({
  word,
  loading,
  result,
  error,
  isPlayingAudio,
  speak,
  addToVocab,
  navigateToWord,
  goBack,
  canGoBack,
  retry,
  onClose,
  theme,
  isMobile,
}: {
  word: string;
  loading: boolean;
  result: DictPayload | null;
  error: string | null;
  isPlayingAudio: boolean;
  speak: () => void;
  addToVocab: () => void;
  navigateToWord: (w: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  retry: () => void;
  onClose: () => void;
  theme: ReaderTheme;
  isMobile?: boolean;
}) {
  const s = THEME_STYLES[theme] || THEME_STYLES.light;
  const [localQuery, setLocalQuery] = useState(word);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalQuery(word);
  }, [word]);

  // Reset scroll when navigating to another word
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [word]);

  const displayTranslation = result?.translation || result?.persian || '';
  const displayPos = result?.partOfSpeech || result?.pos || '';
  const persianGroups = result?.persianMeaningsByPos || [];

  // Group English definitions by part of speech
  const defsByPos = useMemo(() => {
    const map = new Map<string, Array<{ definitionEn: string; example?: string }>>();
    for (const m of result?.meanings || []) {
      if (!m.definitionEn) continue;
      const key = m.pos || '';
      const list = map.get(key) || [];
      if (list.length < 3) list.push({ definitionEn: m.definitionEn, example: m.example });
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [result]);

  function copyTranslation() {
    if (!displayTranslation) return;
    navigator.clipboard
      ?.writeText(displayTranslation)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  const showSkeleton = loading && !result;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Sticky header: word hero ── */}
      <div
        className="sticky top-0 z-10 shrink-0 border-b px-4 pb-3 pt-3 sm:px-5"
        style={{ borderColor: s.border, background: s.bg }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {/* Back (word history) */}
            <AnimatePresence>
              {canGoBack && (
                <motion.button
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  onClick={goBack}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: s.text }}
                  aria-label="بازگشت به واژه قبلی"
                  title="بازگشت به واژه قبلی"
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Audio */}
            <button
              onClick={speak}
              disabled={!word}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none',
              )}
              style={{ background: s.accent + '22', color: s.accent }}
              aria-label="پخش تلفظ صوتی"
              title="پخش تلفظ با صدای طبیعی"
            >
              {isPlayingAudio ? (
                <AudioWaveBars count={3} className="h-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            {/* Word + phonetic + POS */}
            <div className="min-w-0">
              <h3
                className="truncate text-xl font-extrabold tracking-tight sm:text-2xl"
                dir="ltr"
                lang="en"
              >
                {word || 'دیکشنری'}
              </h3>
              {(result?.phonetic || displayPos) && (
                <p className="flex items-center gap-1.5 text-xs opacity-75">
                  {result?.phonetic && (
                    <span className="font-mono" dir="ltr" lang="en">
                      {result.phonetic}
                    </span>
                  )}
                  {displayPos && (
                    <span className="font-semibold" dir="rtl">
                      {POS_FA[displayPos.toLowerCase()] || displayPos}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="h-8 w-8 shrink-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CEFR + frequency badges */}
        {result && (result.difficultyLevel || result.frequencyBand) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 ps-1">
            {result.difficultyLevel && (
              <Badge color={levelColor(result.difficultyLevel)} title="سطح استاندارد CEFR">
                {LEVEL_SHORT[result.difficultyLevel] || result.difficultyLevel}
              </Badge>
            )}
            {result.frequencyBand && (
              <Badge color={freqColor(result.frequencyBand)} title="میزان کاربرد در زبان انگلیسی">
                {FREQ_LABEL[result.frequencyBand] || result.frequencyBand}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Quick search ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (localQuery.trim()) navigateToWord(localQuery.trim());
        }}
        className="shrink-0 border-b px-4 py-2.5 sm:px-5"
        style={{ borderColor: s.border }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="جست‌وجوی واژه یا عبارت انگلیسی..."
            className="w-full rounded-xl border bg-transparent py-2 pe-3 ps-9 text-xs transition-colors focus:outline-hidden focus:ring-1"
            style={{ borderColor: s.border }}
            dir="ltr"
            lang="en"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>

      {/* ── Scrollable content ── */}
      <div
        ref={bodyRef}
        className={cn(
          'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain scroll-warm px-4 py-4 sm:px-5',
          isMobile ? 'pb-6' : 'pb-5',
        )}
      >
        {!word && !loading && <EmptyState />}

        {showSkeleton && <SkeletonContent accent={s.accent} />}

        {error && !loading && !result && (
          <div className="py-8 text-center">
            <p className="text-sm opacity-80">{error}</p>
            <Button variant="outline" size="sm" onClick={retry} className="mt-3">
              تلاش مجدد
            </Button>
          </div>
        )}

        {result && !showSkeleton && (
          <motion.div
            key={result.word}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Primary Persian translation hero */}
            {displayTranslation && (
              <button
                type="button"
                onClick={copyTranslation}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-start shadow-xs transition-transform active:scale-[0.99]"
                style={{
                  borderColor: s.accent + '55',
                  background: s.accent + '10',
                }}
                title="کپی ترجمه"
              >
                <p className="text-lg font-bold leading-relaxed sm:text-xl" dir="rtl" lang="fa">
                  {displayTranslation}
                </p>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-50 transition-opacity group-hover:opacity-100"
                  style={{ background: s.accent + '18', color: s.accent }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-3.5 w-3.5" />}
                </span>
              </button>
            )}

            {/* Persian multi-meanings grouped by POS (Google dict) */}
            {persianGroups.length > 0 && (
              <Section label="معانی فارسی" accent={s.accent} icon={BookOpen}>
                <div className="space-y-3">
                  {persianGroups.map((group) => (
                    <PersianMeaningRow key={group.partOfSpeech} group={group} accent={s.accent} />
                  ))}
                </div>
              </Section>
            )}

            {/* English definitions grouped by POS */}
            {defsByPos.length > 0 && (
              <Section label="English definitions" accent={s.accent} icon={BookOpen} ltr>
                <div className="space-y-3">
                  {defsByPos.map(([pos, defs]) => (
                    <div key={pos || 'x'} className="space-y-2">
                      {pos && <PosTag pos={pos} accent={s.accent} />}
                      <ol className="space-y-2" dir="ltr" lang="en">
                        {defs.map((d, i) => (
                          <li
                            key={i}
                            className="rounded-xl border p-3 text-sm leading-relaxed"
                            style={{ borderColor: s.border }}
                          >
                            {d.definitionEn}
                            {d.example && (
                              <p
                                className="mt-2 border-s-2 ps-2.5 text-xs italic opacity-70"
                                style={{ borderColor: s.accent }}
                              >
                                “{d.example}”
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Fallback single definition when no grouped meanings exist */}
            {!defsByPos.length && result.definition && (
              <Section label="English definition" accent={s.accent} icon={BookOpen} ltr>
                <p className="text-sm leading-relaxed" dir="ltr" lang="en">
                  {result.definition}
                </p>
              </Section>
            )}

            {/* Synonyms */}
            {result.synonyms && result.synonyms.length > 0 && (
              <Section
                label="مترادف‌ها"
                accent={s.accent}
                icon={ArrowLeftRight}
                hint="برای مشاهده کلیک کنید"
              >
                <WordChips
                  words={result.synonyms}
                  onClick={navigateToWord}
                  accent={s.accent}
                  border={s.border}
                  tone="syn"
                />
              </Section>
            )}

            {/* Antonyms */}
            {result.antonyms && result.antonyms.length > 0 && (
              <Section
                label="متضادها"
                accent={s.accent}
                icon={ArrowLeftRight}
                hint="برای مشاهده کلیک کنید"
              >
                <WordChips
                  words={result.antonyms}
                  onClick={navigateToWord}
                  accent={s.accent}
                  border={s.border}
                  tone="ant"
                />
              </Section>
            )}

            {/* Related words */}
            {result.relatedWords && result.relatedWords.length > 0 && (
              <Section
                label="واژه‌های مرتبط"
                accent={s.accent}
                icon={Network}
                hint="برای مشاهده کلیک کنید"
              >
                <WordChips
                  words={result.relatedWords}
                  onClick={navigateToWord}
                  accent={s.accent}
                  border={s.border}
                  tone="rel"
                />
              </Section>
            )}

            {/* Etymology */}
            {result.etymology && result.etymology.trim() && (
              <Section label="ریشه‌شناسی" accent={s.accent} icon={History} ltr>
                <p className="text-xs italic leading-relaxed opacity-80" dir="ltr" lang="en">
                  {result.etymology}
                </p>
              </Section>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Sticky footer ── */}
      <div
        className="shrink-0 border-t px-4 py-3 sm:px-5"
        style={{ borderColor: s.border, background: s.bg }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[10px] opacity-50" title={result?.source}>
            {result?.source ? `منابع: ${result.source}` : 'دیکشنری هوشمند بوکزی'}
          </span>
          <Button
            size="sm"
            onClick={addToVocab}
            disabled={!result || loading}
            className="gap-1.5 rounded-xl px-4 font-bold shadow"
            style={{ background: s.accent, color: '#fff' }}
          >
            <BookmarkPlus className="h-4 w-4" />
            افزودن به واژگان
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center opacity-70">
      <BookOpen className="h-10 w-10 opacity-40" />
      <p className="text-sm font-medium">واژه مورد نظر خود را در کادر بالا جست‌وجو کنید</p>
      <p className="text-xs opacity-70">ترجمه دو زبانه، معانی چندگانه، مترادف، متضاد و تلفظ صوتی</p>
    </div>
  );
}

function SkeletonContent({ accent }: { accent: string }) {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="h-16 animate-pulse rounded-2xl" style={{ background: accent + '14' }} />
      <div className="space-y-2.5">
        <div
          className="h-3.5 w-24 animate-pulse rounded-full opacity-20"
          style={{ background: accent }}
        />
        <div className="flex gap-1.5">
          {['w-20', 'w-16', 'w-24', 'w-14'].map((w, i) => (
            <div
              key={i}
              className={cn('h-8 animate-pulse rounded-full opacity-15', w)}
              style={{ background: accent }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        <div
          className="h-3.5 w-28 animate-pulse rounded-full opacity-20"
          style={{ background: accent }}
        />
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl opacity-10"
            style={{ background: accent }}
          />
        ))}
      </div>
      <p className="pt-1 text-center text-xs opacity-60">در حال دریافت بهترین معنی از چند منبع…</p>
    </div>
  );
}

function Badge({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        background: color + '1f',
        color,
        border: `1px solid ${color}55`,
      }}
      title={title}
    >
      {children}
    </span>
  );
}

function Section({
  label,
  children,
  accent,
  icon: Icon,
  hint,
  ltr,
}: {
  label: string;
  children: React.ReactNode;
  accent: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hint?: string;
  ltr?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5" dir={ltr ? 'ltr' : undefined}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />}
        <span className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</span>
        {hint && <span className="text-[10px] font-normal opacity-50">({hint})</span>}
      </div>
      {children}
    </div>
  );
}

function PosTag({ pos, accent }: { pos: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: accent + '1a', color: accent }}
    >
      {posFa(pos) !== pos ? (
        <>
          <span dir="rtl">{posFa(pos)}</span>
          <span dir="ltr" className="opacity-60">
            {pos}
          </span>
        </>
      ) : (
        <span dir="ltr">{pos}</span>
      )}
    </span>
  );
}

function PersianMeaningRow({ group, accent }: { group: PersianMeaningGroup; accent: string }) {
  return (
    <div className="space-y-1.5">
      <PosTag pos={group.partOfSpeech} accent={accent} />
      <div className="flex flex-wrap gap-1.5" dir="rtl">
        {group.translations.map((t, i) => (
          <span
            key={`${t.persian}-${i}`}
            className="inline-flex min-w-0 flex-col items-center rounded-xl border px-3 py-1.5"
            style={{ borderColor: accent + '40', background: accent + '0d' }}
            title={t.backTranslations?.length ? `≈ ${t.backTranslations.join(', ')}` : undefined}
          >
            <span className="text-sm font-bold leading-6" dir="rtl" lang="fa">
              {t.persian}
            </span>
            {t.backTranslations && t.backTranslations.length > 0 && (
              <span
                className="max-w-[140px] truncate text-[10px] leading-4 opacity-55"
                dir="ltr"
                lang="en"
              >
                ≈ {t.backTranslations.join(', ')}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function WordChips({
  words,
  onClick,
  accent,
  border,
  tone,
}: {
  words: string[];
  onClick: (w: string) => void;
  accent: string;
  border: string;
  tone: 'syn' | 'ant' | 'rel';
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((w, i) => (
        <button
          key={`${w}-${i}`}
          onClick={() => onClick(w)}
          className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-[transform,opacity,colors,border-color,background-color] hover:scale-105 active:scale-95"
          style={{
            borderColor: border,
            background:
              tone === 'ant' ? accent + '0f' : tone === 'rel' ? accent + '18' : accent + '12',
          }}
          dir="ltr"
          lang="en"
          aria-label={`جست‌وجوی «${w}» در دیکشنری`}
          title={`جست‌وجوی «${w}» در دیکشنری`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
