'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn, slugify } from '@/lib/utils'
import {
  Bot,
  Eraser,
  Languages,
  ListChecks,
  Loader2,
  ScrollText,
  SendHorizonal,
  Sparkles,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReaderTheme } from '@/lib/reader/types'
import { THEME_STYLES } from '@/lib/reader/types'
import { getStorageKey } from '@/lib/storage-keys'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatPanelProps {
  bookTitle: string
  bookAuthor?: string
  bookContext: string
  selectedText?: string
  theme: ReaderTheme
  isMobile: boolean
  /** Stable per-book slug for chat persistence (`ky_chat_{slug}`). Falls back to a
   * slugified book title if not provided. */
  bookSlug?: string
  open: boolean
  onClose: () => void
}

/** Quick-action buttons — always visible above the input. */
const QUICK_ACTIONS = [
  {
    key: 'translate',
    label: 'ترجمه این پاراگراف',
    icon: Languages,
  },
  {
    key: 'grammar',
    label: 'توضیح گرامر',
    icon: Sparkles,
  },
  {
    key: 'hard-words',
    label: 'کلمات سخت را لیست کن',
    icon: ListChecks,
  },
] as const

const DEFAULT_GREETING = (bookTitle: string): ChatMessage => ({
  role: 'assistant',
  content: `سلام! من دستیار مطالعه‌ی «${bookTitle}» هستم. هر سوالی درباره‌ی متن، کلمات یا پیرنگ داری بپرس، یا یکی از دکمه‌های سریع زیر را امتحان کن.`,
})

export function AIChatPanel({
  bookTitle,
  bookAuthor,
  bookContext,
  selectedText,
  theme,
  isMobile,
  bookSlug,
  open,
  onClose,
}: AIChatPanelProps) {
  const s = THEME_STYLES[theme]
  const storageKey = getStorageKey('chat', bookSlug || (slugify(bookTitle).slice(0, 60) || 'book'))

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    DEFAULT_GREETING(bookTitle),
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  /** Index of the assistant message currently typing-out. null = none. */
  const [typingIndex, setTypingIndex] = useState<number | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const hydratedRef = useRef(false)

  // ---- Load persisted chat on mount ----
  useEffect(() => {
    let loaded = false
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (m) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string',
          )
        ) {
          setMessages(parsed.slice(-50))
          loaded = true
        }
      }
    } catch {}
    hydratedRef.current = true
    // If we loaded an old history, no typing animation.
    if (!loaded) setTypingIndex(null)
  }, [storageKey])

  // ---- Persist on change (debounced, max 50 messages) ----
  useEffect(() => {
    if (!hydratedRef.current) return
    const id = window.setTimeout(() => {
      try {
        // Don't persist if it's just the default greeting alone — keeps storage clean.
        if (messages.length <= 1) {
          localStorage.removeItem(storageKey)
          return
        }
        localStorage.setItem(
          storageKey,
          JSON.stringify(messages.slice(-50)),
        )
      } catch {}
    }, 250)
    return () => window.clearTimeout(id)
  }, [messages, storageKey])

  // ---- Auto-scroll on new content / typing progress ----
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading, typingIndex])

  const sendRaw = useCallback(
    async (payload: ChatMessage[], contextText: string) => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            messages: payload.map((m) => ({ role: m.role, content: m.content })),
            bookContext: contextText,
            selectedText,
          }),
        })
        const data = await res.json()
        const content =
          data.content || 'پاسخی دریافت نشد. دوباره تلاش کنید.'
        setMessages((prev) => [...prev, { role: 'assistant', content }])
        // The new assistant message is at index `payload.length` (0-based) after append.
        setTypingIndex(payload.length)
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'خطا در ارتباط با هوش مصنوعی. دوباره تلاش کنید.',
          },
        ])
        setTypingIndex(null)
      } finally {
        setLoading(false)
      }
    },
    [selectedText],
  )

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    // Snap any in-flight typing animation to completion.
    setTypingIndex(null)
    const next = [...messages, { role: 'user' as const, content: trimmed }]
    setMessages(next)
    setInput('')
    await sendRaw(next, bookContext)
  }

  /** Quick action: translate the current paragraph via /api/ai/translate
   * (richer than asking the chat model). */
  async function quickTranslate() {
    if (!bookContext || loading) return
    setTypingIndex(null)
    const userMsg: ChatMessage = {
      role: 'user',
      content: 'ترجمه این پاراگراف',
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: bookContext }),
      })
      const data = await res.json()
      const translation = data.translation || 'ترجمه ناموفق بود.'
      const notes = data.notes ? `\n\nنکته: ${data.notes}` : ''
      const content = `🌐 ترجمه:\n${translation}${notes}`
      setMessages((prev) => [...prev, { role: 'assistant', content }])
      setTypingIndex(next.length)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'خطا در ترجمه. دوباره تلاش کنید.',
        },
      ])
      setTypingIndex(null)
    } finally {
      setLoading(false)
    }
  }

  /** Quick action: explain grammar of the current paragraph (via /api/ai/chat). */
  function quickGrammar() {
    if (!bookContext || loading) return
    send('گرامر این پاراگراف را به فارسی توضیح بده')
  }

  /** Quick action: list hard words of the current paragraph (via /api/ai/chat). */
  function quickHardWords() {
    if (!bookContext || loading) return
    send('۵ کلمه‌ی سخت این پاراگراف را با معنی فارسی لیست کن')
  }

  function clearChat() {
    setMessages([DEFAULT_GREETING(bookTitle)])
    setTypingIndex(null)
    try {
      localStorage.removeItem(storageKey)
    } catch {}
  }

  const widthClass = isMobile ? 'w-full' : 'w-[26rem] sm:w-[28rem]'
  const hasContext = bookContext.trim().length > 0

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          'gap-0 border-e-2 p-0 sm:max-w-none',
          widthClass,
        )}
        style={{ background: s.bg, color: s.text, borderColor: s.border }}
      >
        <SheetTitle className="sr-only">دستیار هوش مصنوعی</SheetTitle>
        <SheetDescription className="sr-only">
          گفت‌وگو با هوش مصنوعی دربارهٔ متن کتاب — ترجمه، توضیح گرامر و فهرست کلمات سخت.
        </SheetDescription>

      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: s.border }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: s.accent + '22', color: s.accent }}
          >
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold leading-tight">
              دستیار هوش مصنوعی
            </h3>
            <p className="truncate text-[11px] opacity-70">{bookAuthor}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Summarize button — opens a small popover */}
          <Popover
            open={showSummary}
            onOpenChange={(o) => setShowSummary(o)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!hasContext}
                aria-label="خلاصه این صفحه"
                title="خلاصه این صفحه"
                className="h-11 w-11"
              >
                <ScrollText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-80 max-w-[90vw] rounded-xl border-2 p-0"
              style={{
                background: s.bg,
                color: s.text,
                borderColor: s.border,
              }}
            >
              <SummarizeBody
                bookTitle={bookTitle}
                bookContext={bookContext}
                accent={s.accent}
                border={s.border}
                muted={s.muted}
              />
            </PopoverContent>
          </Popover>

          {/* Clear chat */}
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            aria-label="پاک کردن گفتگو"
            title="پاک کردن گفتگو"
            className="h-11 w-11"
            disabled={messages.length <= 1 && !loading}
          >
            <Eraser className="h-4 w-4" />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن"
            className="h-11 w-11"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto scroll-warm px-4 py-4"
        style={{ maxHeight: 'calc(100dvh - 16rem)' }}
      >
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            message={m}
            accent={s.accent}
            border={s.border}
            typing={typingIndex === i}
          />
        ))}
        {loading && (
          <div
            className="flex items-center gap-2 text-sm opacity-70"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال فکر کردن...
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-t px-3 pt-2.5 pb-1">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon
          return (
            <button
              key={qa.key}
              onClick={() => {
                if (qa.key === 'translate') quickTranslate()
                else if (qa.key === 'grammar') quickGrammar()
                else quickHardWords()
              }}
              disabled={loading || !hasContext}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 tap-target"
              style={{
                borderColor: s.border,
                background: s.accent + '15',
                color: s.text,
              }}
              title={!hasContext ? 'ابتدا متنی برای تحلیل موجود نیست' : qa.label}
            >
              <Icon className="h-3 w-3" style={{ color: s.accent }} />
              {qa.label}
            </button>
          )
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex shrink-0 items-center gap-2 border-t px-3 py-3 pb-safe"
        style={{ borderColor: s.border }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="سوال خود را بنویسید..."
          data-reader-input="true"
          className="flex-1 rounded-full border bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: s.border }}
          dir="rtl"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className="rounded-full"
          aria-label="ارسال"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
      </SheetContent>
    </Sheet>
  )
}

// ---------- Chat bubble with typing animation ----------

function ChatBubble({
  message,
  accent,
  border,
  typing,
}: {
  message: ChatMessage
  accent: string
  border: string
  typing: boolean
}) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser ? 'rounded-ee-sm text-white' : 'rounded-ss-sm',
        )}
        style={
          isUser
            ? { background: accent }
            : { background: accent + '14', border: `1px solid ${border}` }
        }
        dir="auto"
      >
        {isUser || !typing ? (
          message.content
        ) : (
          <TypingText text={message.content} accent={accent} />
        )}
      </div>
    </div>
  )
}

/** Character-by-character reveal for the latest assistant message. */
function TypingText({ text, accent }: { text: string; accent: string }) {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    setRevealed(0)
    let i = 0
    const id = window.setInterval(() => {
      // Reveal ~3 chars every ~16ms — fast enough to feel alive, slow enough to feel "AI".
      i = Math.min(text.length, i + 3)
      setRevealed(i)
      if (i >= text.length) window.clearInterval(id)
    }, 16)
    return () => window.clearInterval(id)
  }, [text])

  const done = revealed >= text.length
  return (
    <>
      {text.slice(0, revealed)}
      {!done && (
        <span
          className="ms-0.5 inline-block w-1.5 animate-pulse"
          style={{ color: accent }}
          aria-hidden
        >
          ▍
        </span>
      )}
    </>
  )
}

// ---------- Summarize popover body ----------

function SummarizeBody({
  bookTitle,
  bookContext,
  accent,
  muted,
}: {
  bookTitle: string
  bookContext: string
  accent: string
  border: string
  muted: string
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )
  const [summary, setSummary] = useState('')
  const [fetchedSig, setFetchedSig] = useState('')

  // Cheap content signature — refetch when the paragraph changes.
  const sig = bookContext.slice(0, 120)

  const fetchSummary = useCallback(async () => {
    if (!bookContext) return
    setState('loading')
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: bookContext, bookTitle }),
      })
      const data = await res.json()
      setSummary(data.summary || 'خلاصه‌ای دریافت نشد.')
      setFetchedSig(sig)
      setState('done')
    } catch {
      setState('error')
    }
  }, [bookContext, bookTitle, sig])

  // Auto-fetch on first open or when the paragraph changes.
  useEffect(() => {
    if (state === 'loading') return
    if (sig !== fetchedSig) {
      void fetchSummary()
    }
  }, [sig, fetchedSig, state, fetchSummary])

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: accent + '22', color: accent }}
        >
          <ScrollText className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-xs font-bold">خلاصه این صفحه</p>
          <p className="text-[10px] opacity-60">۲ تا ۳ جمله فارسی</p>
        </div>
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-2 py-3 text-xs opacity-70">
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: accent }} />
          در حال خلاصه‌سازی...
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-2">
          <p className="text-xs opacity-80">
            خطا در دریافت خلاصه. دوباره تلاش کنید.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSummary}
            className="h-7 gap-1.5 text-xs"
          >
            تلاش دوباره
          </Button>
        </div>
      )}

      {state === 'done' && (
        <p className="text-xs leading-relaxed" dir="auto">
          {summary}
        </p>
      )}

      {state === 'idle' && (
        <p className="text-xs opacity-60" style={{ color: muted }}>
          در حال آماده‌سازی...
        </p>
      )}

      {state === 'done' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchSummary}
          className="h-7 gap-1.5 text-[11px]"
          style={{ color: accent }}
        >
          <Sparkles className="h-3 w-3" />
          خلاصه‌ی دوباره
        </Button>
      )}
    </div>
  )
}
