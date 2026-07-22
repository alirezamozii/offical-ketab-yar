import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiChat, SYSTEM_PROMPTS, type ChatMessage } from '@/lib/ai'
import { aiRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validate'
import { apiError } from '@/lib/api-error'

// ── Input validation ─────────────────────────────────────────────────────────
//
// Tight caps on every LLM-bound string:
//   • messages ≤ 50 items — keeps the conversation history within token limits.
//   • per-message content ≤ 4 000 chars — a single huge message would dominate
//     the context window and cause the model to truncate the book context.
//   • bookContext ≤ 4 000 chars — mirrors the original `.slice(0, 4000)` but
//     now enforced at the schema layer (so a 4100-char body never even gets
//     to the LLM).
//   • selectedText ≤ 1 000 chars — the original code silently truncated to 500
//     chars anyway; we cap at 1 000 to give the user a little headroom while
//     still preventing multi-KB dumps.
const MAX_MESSAGES = 50
const MAX_MESSAGE_CONTENT = 4_000
const MAX_BOOK_CONTEXT = 4_000
const MAX_SELECTED_TEXT = 1_000

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z
    .string()
    .trim()
    .min(1, 'پیام خالی است.')
    .max(MAX_MESSAGE_CONTENT, `هر پیام نمی‌تواند بیشتر از ${MAX_MESSAGE_CONTENT} کاراکتر باشد.`),
})

const ChatSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1, 'messages required')
    .max(MAX_MESSAGES, `تعداد پیام‌ها نمی‌تواند بیشتر از ${MAX_MESSAGES} باشد.`),
  bookContext: z
    .string()
    .trim()
    .max(MAX_BOOK_CONTEXT, `متن زمینه‌ی کتاب نمی‌تواند بیشتر از ${MAX_BOOK_CONTEXT} کاراکتر باشد.`)
    .optional()
    .or(z.literal('')),
  selectedText: z
    .string()
    .trim()
    .max(MAX_SELECTED_TEXT, `متن انتخاب‌شده نمی‌تواند بیشتر از ${MAX_SELECTED_TEXT} کاراکتر باشد.`)
    .optional()
    .or(z.literal('')),
})

export async function POST(req: NextRequest) {
  // ⏱ Rate limit — anonymous 20/min, authenticated 60/min.
  const blocked = await aiRateLimit(req, { anonLimit: 20, authLimit: 60, name: 'ai-chat' })
  if (blocked) return blocked

  const parsed = await parseBody(req, ChatSchema)
  if (!parsed.ok) return parsed.response

  const messages: ChatMessage[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  const bookContext = parsed.data.bookContext?.trim() ?? ''
  const selectedText = parsed.data.selectedText?.trim() ?? ''

  try {
    const systemMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.CHAT },
    ]
    if (bookContext) {
      systemMessages.push({
        role: 'system',
        content: `متن صفحه‌ی فعلی کتاب (برای پاسخ به پرسش‌های مربوط به متن از همین استفاده کن):\n"""\n${bookContext.slice(0, MAX_BOOK_CONTEXT)}\n"""`,
      })
    }
    if (selectedText) {
      systemMessages.push({
        role: 'system',
        content: `کاربر این متن را انتخاب کرده است (اگر درباره‌ی آن پرسید، روی همین متن تمرکز کن): «${selectedText.slice(0, 500)}»`,
      })
    }

    const answer = await aiChat([...systemMessages, ...messages], {
      temperature: 0.55,
    })

    if (!answer) {
      return NextResponse.json(
        {
          content:
            'متأسفم، الان نمی‌توانم پاسخ دهم. لطفاً چند ثانیه بعد دوباره تلاش کن یا سؤال را ساده‌تر کن.',
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ content: answer })
  } catch (err) {
    console.error('[/api/ai/chat] POST failed:', err)
    return apiError('پاسخ‌گویی ناموفق بود. لطفاً دوباره تلاش کنید.', 500)
  }
}
